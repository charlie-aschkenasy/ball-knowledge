// ============================================================
// Edge Function: propose-question
// User-submitted question flow (UGC). A signed-in user proposes a prompt + sport;
// we rate-limit, store it as a proposal, and (if generation is enabled) use Claude
// IN THE BACKGROUND to draft the correct answer + 3 distractor options + a source +
// a confidence note. The admin later reviews, assigns difficulty, and approves it
// into the live `questions` bank.
//
// The submitting user never sees the generated answer — they only get a "submitted"
// confirmation and can watch their proposal's status. Generation runs via
// EdgeRuntime.waitUntil so the user response is instant and the LLM latency is
// decoupled from the request.
//
// Requires the ANTHROPIC_API_KEY secret to generate. Without it, proposals are
// stored as 'pending' and can be generated later (this keeps the UI working before
// the key is configured). Deploy with "Verify JWT" ON.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.69.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PROPOSALS_PER_DAY = 5;
const MAX_PROMPT_LEN = 300;

// Structured-output schema: forces Claude to return exactly this shape.
const GEN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    is_appropriate: { type: 'boolean', description: 'false if the prompt is offensive, nonsensical, or not a real sports trivia question' },
    rejection_reason: { type: ['string', 'null'], description: 'why it was rejected, if is_appropriate is false' },
    correct_answer: { type: ['string', 'null'], description: 'the single correct answer' },
    options: { type: 'array', items: { type: 'string' }, description: 'exactly 4 options including the correct answer, plausible distractors' },
    correct_index: { type: ['integer', 'null'], description: 'index (0-3) of the correct answer within options' },
    source_url: { type: ['string', 'null'], description: 'a real, citable source URL for the answer, or null if you are not confident a real source exists' },
    confidence: { type: 'string', description: 'high | medium | low — your confidence the answer is correct' },
  },
  required: ['is_appropriate', 'rejection_reason', 'correct_answer', 'options', 'correct_index', 'source_url', 'confidence'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 1. Auth.
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: 'Not signed in.' }, 401);

  // 2. Validate input.
  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  const sport = typeof body?.sport === 'string' ? body.sport.trim() : '';
  if (!prompt || prompt.length > MAX_PROMPT_LEN) {
    return json({ error: `Question must be 1–${MAX_PROMPT_LEN} characters.` }, 400);
  }
  if (!sport) return json({ error: 'Pick a sport.' }, 400);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 3. Rate limit (per user, last 24h).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('question_proposals')
    .select('id', { count: 'exact', head: true })
    .eq('submitted_by', user.id)
    .gte('created_at', since);
  if ((count ?? 0) >= MAX_PROPOSALS_PER_DAY) {
    return json({ error: `Daily limit reached (${MAX_PROPOSALS_PER_DAY} proposals/day). Try again tomorrow.` }, 429);
  }

  // 4. Store the proposal as pending.
  const { data: proposal, error: insErr } = await admin
    .from('question_proposals')
    .insert({ submitted_by: user.id, prompt, sport, status: 'pending' })
    .select('id')
    .single();
  if (insErr || !proposal) return json({ error: 'Could not save your proposal.' }, 500);

  // 5. Generate in the background if the key is configured. The user response is
  //    returned immediately regardless.
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (apiKey) {
    // @ts-ignore EdgeRuntime is provided by the Supabase runtime.
    EdgeRuntime.waitUntil(generate(admin, apiKey, proposal.id, prompt, sport));
  }

  return json({ status: 'pending', message: 'Thanks! Your question was submitted for review.' });
});

async function generate(
  admin: ReturnType<typeof createClient>,
  apiKey: string,
  proposalId: string,
  prompt: string,
  sport: string,
) {
  try {
    const anthropic = new Anthropic({ apiKey });
    const res = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      output_config: { format: { type: 'json_schema', schema: GEN_SCHEMA } },
      system:
        'You author multiple-choice sports trivia. Given a user-proposed question and sport, ' +
        'determine the correct answer, then write exactly 4 answer options (the correct one plus ' +
        '3 plausible but wrong distractors), give the index of the correct option, a real citable ' +
        'source URL if you are confident one exists (else null), and your confidence. If the prompt ' +
        'is offensive, nonsensical, or not a real sports question, set is_appropriate=false and explain.',
      messages: [{ role: 'user', content: `Sport: ${sport}\nQuestion: ${prompt}` }],
    });

    const textBlock = res.content.find((b: any) => b.type === 'text') as any;
    const out = JSON.parse(textBlock?.text ?? '{}');

    if (!out.is_appropriate) {
      await admin.from('question_proposals').update({
        status: 'rejected',
        rejection_reason: out.rejection_reason ?? 'Not a suitable question.',
      }).eq('id', proposalId);
      return;
    }

    const options: string[] = Array.isArray(out.options) ? out.options : [];
    const idx: number | null = typeof out.correct_index === 'number' ? out.correct_index : null;
    if (options.length !== 4 || idx === null || idx < 0 || idx > 3) {
      await admin.from('question_proposals').update({
        status: 'failed',
        gen_error: 'Model did not return 4 options with a valid correct index.',
      }).eq('id', proposalId);
      return;
    }

    await admin.from('question_proposals').update({
      status: 'generated',
      generated_options: options,
      generated_correct_index: idx,
      source_url: out.source_url ?? null,
      confidence: typeof out.confidence === 'string' ? out.confidence : null,
    }).eq('id', proposalId);
  } catch (e) {
    await admin.from('question_proposals').update({
      status: 'failed',
      gen_error: String(e instanceof Error ? e.message : e).slice(0, 500),
    }).eq('id', proposalId);
  }
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
