// ============================================================
// Edge Function: submit
// Grades a player's answers ON THE SERVER, enforces the server-anchored time
// window (hard-reject if expired / never started), writes the score, captures
// one answer_events row per question (for later difficulty/points tuning), and
// only then returns what was correct (for the recap screen). The client never
// had the answers and cannot write to `submissions` / `answer_events`, so scores
// and analytics can't be faked. The client-sent started_at is ignored.
//
// Expected request body:
//   { "answers": [ { "questionId": "nba-easy-1", "value": { "selectedIndex": 1 }, "timeMs": 4200 }, ... ],
//     "started_at": "2026-06-07T10:00:00.000Z" }
// value shapes by type:
//   multiple_choice -> { selectedIndex: number }
//   fill_in_blank   -> { text: string }
//   matching        -> { mapping: { [left]: right } }
// timeMs is optional (ms the player spent on that question).
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const POINTS_PER_QUESTION = 10;

// Per-question time limits (seconds), mirrored from the client quiz. The server
// window is the sum over today's questions + a buffer for reveal/feedback/network.
const TIMER_BY_TYPE: Record<string, number> = {
  multiple_choice: 15,
  fill_in_blank: 22,
  matching: 28,
};
const DEFAULT_TIMER = 20;
const BUFFER_SECONDS = 60;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an)\s+/, '');
}

function isCorrect(q: any, value: any): boolean {
  if (value == null) return false;
  if (q.type === 'multiple_choice') {
    return value.selectedIndex === q.correct_index;
  }
  if (q.type === 'fill_in_blank') {
    if (typeof value.text !== 'string' || !value.text) return false;
    const norm = normalize(value.text);
    return (q.acceptable_answers ?? []).some((a: string) => normalize(a) === norm);
  }
  if (q.type === 'matching') {
    const mapping = value.mapping ?? {};
    return (q.pairs ?? []).every((p: any) => mapping[p.left] === p.right);
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 1. Identify the caller from their JWT (sent automatically by supabase-js).
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: 'Not signed in.' }, 401);

  // 2. Read submitted answers.
  const body = await req.json().catch(() => null);
  const submitted = body?.answers as { questionId: string; value: any; timeMs?: number }[] | undefined;
  if (!submitted || !Array.isArray(submitted)) {
    return json({ error: 'Bad request: answers missing.' }, 400);
  }

  // 3. Service-role client for the privileged reads/writes.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const today = new Date().toISOString().slice(0, 10);

  // 4. Confirm these are today's questions, then load them (with answers).
  const { data: set } = await admin
    .from('daily_sets').select('question_ids').eq('play_date', today).single();
  if (!set) return json({ error: 'No daily set for today.' }, 404);

  const { data: questions } = await admin
    .from('questions').select('*').in('id', set.question_ids);
  if (!questions) return json({ error: 'Could not load questions.' }, 500);
  const qById = new Map(questions.map((q) => [q.id, q]));

  // 5. Enforce the server-anchored time window BEFORE grading or writing anything.
  //    The start was recorded by get-today; the client-sent started_at is ignored.
  const { data: startRow } = await admin
    .from('quiz_starts').select('started_at')
    .eq('user_id', user.id).eq('play_date', today).maybeSingle();
  if (!startRow) {
    return json({ error: 'Start today’s quiz first.' }, 403);
  }
  const allowedMs = (set.question_ids.reduce((sum: number, id: string) => {
    const q = qById.get(id);
    return sum + (TIMER_BY_TYPE[q?.type] ?? DEFAULT_TIMER);
  }, 0) + BUFFER_SECONDS) * 1000;
  const serverStartedAt = startRow.started_at as string;
  if (Date.now() - new Date(serverStartedAt).getTime() > allowedMs) {
    return json({ error: 'Time’s up — this quiz has expired.' }, 403);
  }

  // 6. Grade on the server.
  let correctCount = 0;
  const recap = set.question_ids.map((id: string) => {
    const q = qById.get(id);
    const a = submitted.find((s) => s.questionId === id);
    const wasCorrect = q ? isCorrect(q, a?.value ?? null) : false;
    if (wasCorrect) correctCount++;
    return {
      questionId: id,
      wasCorrect,
      // Safe to reveal now that they've submitted:
      correctIndex: q?.correct_index ?? null,
      acceptableAnswers: q?.acceptable_answers ?? null,
      pairs: q?.pairs ?? null,
    };
  });
  const score = correctCount * POINTS_PER_QUESTION;

  // 7. Write the score (service role bypasses RLS; unique(user,day) = one play/day).
  //    Use the SERVER-anchored start, not the client's.
  const submittedAt = new Date().toISOString();
  const { error: insErr } = await admin.from('submissions').insert({
    user_id: user.id,
    play_date: today,
    answers: submitted,
    started_at: serverStartedAt,
    correct_count: correctCount,
    score,
  });
  if (insErr) {
    return json({ error: 'You have already played today.', detail: insErr.message }, 409);
  }

  // 8. Capture one answer_events row per question for later tuning. Snapshot the
  //    question's sport/difficulty/type so re-tuning later won't rewrite history.
  //    Best-effort: the score is already saved, so a capture failure must not
  //    break the player's result. unique(user,question,day) guards retries.
  const wasCorrectById = new Map(recap.map((r) => [r.questionId, r.wasCorrect]));
  const events = set.question_ids.map((id: string) => {
    const q = qById.get(id);
    const a = submitted.find((s) => s.questionId === id);
    const timeMs = typeof a?.timeMs === 'number' && isFinite(a.timeMs)
      ? Math.round(a.timeMs)
      : null;
    return {
      user_id: user.id,
      question_id: id,
      play_date: today,
      submitted_at: submittedAt,
      was_correct: wasCorrectById.get(id) ?? false,
      answer: a?.value ?? null,
      time_ms: timeMs,
      sport: q?.sport ?? null,
      difficulty: q?.difficulty ?? null,
      type: q?.type ?? null,
    };
  });
  const { error: evErr } = await admin
    .from('answer_events')
    .upsert(events, { onConflict: 'user_id,question_id,play_date', ignoreDuplicates: true });
  if (evErr) console.error('answer_events capture failed:', evErr.message);

  return json({
    play_date: today,
    correctCount,
    total: set.question_ids.length,
    score,
    recap,
  });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
