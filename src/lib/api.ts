// ===========================================================================
// Backend API — the real play flow.
//
// Three calls, all server-authoritative:
//   getToday()        -> the daily quiz (questions come back WITHOUT answers)
//   submitQuiz()      -> grades the run; returns score + per-question recap
//   getLeaderboard()  -> reads the "leaderboard" view (display_name, score)
//
// Edge Functions are called with the signed-in user's JWT (Supabase attaches
// it automatically via the access token we read from the session). The leader-
// board is a plain view read through PostgREST.
//
// IMPORTANT — server-driven shapes:
//   * `sport` is an arbitrary string (e.g. "Basketball", "Golf"). Do NOT assume
//     a fixed sport list.
//   * `difficulty` is a number 1..5. Do NOT assume easy/medium/hard buckets.
//   * Questions arrive with no answer key, so we cannot grade locally — the
//     `submit` response is the source of truth for correctness.
// ===========================================================================

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

// ---------------------------------------------------------------------------
// Types (mirror the live backend contract)
// ---------------------------------------------------------------------------

/** A single question as returned by get-today (no answer fields). */
export interface ServerQuestion {
  id: string;
  /** "multiple_choice" today; treat as an open string for forward-compat. */
  type: string;
  /** Plain string — NOT a fixed enum. */
  sport: string;
  /** 1..5. */
  difficulty: number;
  /** The question text. */
  prompt: string;
  /** Present for multiple_choice. */
  options?: string[];
}

export interface TodayQuiz {
  play_date: string;
  started_at: string;
  questions: ServerQuestion[];
}

/** One question's outcome in the submit recap. */
export interface RecapItem {
  questionId: string;
  wasCorrect: boolean;
  /** multiple_choice: index of the correct option (else null). */
  correctIndex: number | null;
  /** fill_in_blank: accepted answers (else null). */
  acceptableAnswers: string[] | null;
  /** matching: correct pairs (else null). */
  pairs: { left: string; right: string }[] | null;
}

export interface SubmitResult {
  play_date: string;
  correctCount: number;
  total: number;
  score: number;
  recap: RecapItem[];
}

/** A row of the "leaderboard" view. */
export interface LeaderboardRow {
  display_name: string;
  score: number;
}

/**
 * A player's selection for one question, keyed by question id.
 * For multiple_choice this is the chosen option index (or null = no answer).
 */
export type SelectedAnswers = Record<string, number | null>;

/** Thrown when the user already submitted today (once-per-day backend lock). */
export class AlreadyPlayedError extends Error {
  constructor(message = 'You have already played today.') {
    super(message);
    this.name = 'AlreadyPlayedError';
  }
}

// ---------------------------------------------------------------------------
// Edge Function helper
// ---------------------------------------------------------------------------

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? SUPABASE_ANON_KEY;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  // Parse the body once; the function returns JSON for both success and error.
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const errMsg =
      (payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `${name} failed (${res.status})`;
    if (/already played/i.test(errMsg)) throw new AlreadyPlayedError(errMsg);
    throw new Error(errMsg);
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch today's quiz. Questions come back without answers. */
export function getToday(): Promise<TodayQuiz> {
  return callFunction<TodayQuiz>('get-today', {});
}

/**
 * Encode one selection into the submit payload item. The `submit` Edge
 * Function matches answers by `questionId` and grades multiple choice via
 * `value.selectedIndex === correct_index` (other types use value.text /
 * value.mapping). Keep this shape in sync with that function.
 */
function encodeAnswer(questionId: string, selected: number | null) {
  return { questionId, value: { selectedIndex: selected } };
}

/**
 * Submit the player's answers and get back the graded result. The order of
 * `answers` mirrors the quiz order. `startedAt` (from get-today) is recorded on
 * the submission. Throws AlreadyPlayedError if the user has already played today.
 */
export function submitQuiz(
  selected: SelectedAnswers,
  startedAt?: string,
): Promise<SubmitResult> {
  const answers = Object.entries(selected).map(([id, value]) =>
    encodeAnswer(id, value),
  );
  return callFunction<SubmitResult>('submit', { answers, started_at: startedAt });
}

/** Read the leaderboard view, highest score first. */
export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('display_name, score')
    .order('score', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderboardRow[];
}
