// ============================================================
// Edge Function: get-today
// Returns today's questions with ALL answer data stripped out, and records the
// signed-in user's server-anchored start time (first fetch wins — re-fetching
// never resets the clock). `submit` enforces the time window against it.
// Deploy with "Verify JWT" ON.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Service-role client: bypasses RLS so it can read the locked questions table
  // and write quiz_starts. SUPABASE_URL / SERVICE_ROLE_KEY are auto-provided.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD

  // 1. Which questions are today's?
  const { data: set, error: setErr } = await admin
    .from('daily_sets')
    .select('question_ids')
    .eq('play_date', today)
    .single();

  if (setErr || !set) {
    return json({ error: 'No daily set published for today.' }, 404);
  }

  // 2. Load those questions (only the service role can read this table).
  const { data: questions, error: qErr } = await admin
    .from('questions')
    .select('*')
    .in('id', set.question_ids);

  if (qErr || !questions) {
    return json({ error: 'Could not load questions.' }, 500);
  }

  // 3. Anchor the start time for the signed-in user. First fetch wins; a re-fetch
  //    leaves the original started_at untouched (ignoreDuplicates), so the clock
  //    can't be reset. Anonymous callers (no user) just skip this.
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (user) {
    await admin
      .from('quiz_starts')
      .upsert({ user_id: user.id, play_date: today }, {
        onConflict: 'user_id,play_date',
        ignoreDuplicates: true,
      });
  }

  // 4. Preserve the daily set's order.
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered = set.question_ids
    .map((id: string) => byId.get(id))
    .filter(Boolean) as any[];

  // 5. STRIP every answer field before it leaves the server.
  const safe = ordered.map((q) => {
    const base = {
      id: q.id,
      type: q.type,
      sport: q.sport,
      difficulty: q.difficulty,
      prompt: q.prompt,
    };
    if (q.type === 'multiple_choice') {
      return { ...base, options: q.options }; // options shown, correct_index withheld
    }
    if (q.type === 'matching') {
      const pairs = (q.pairs ?? []) as { left: string; right: string }[];
      return {
        ...base,
        lefts: pairs.map((p) => p.left),
        rights: pairs.map((p) => p.right).sort(() => Math.random() - 0.5),
      };
    }
    return base; // fill_in_blank: no answer hints
  });

  return json({
    play_date: today,
    started_at: new Date().toISOString(),
    questions: safe,
  });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
