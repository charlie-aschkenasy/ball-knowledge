// ---------------------------------------------------------------------------
// Persistent player state via localStorage.
//
// Everything here survives a page refresh. This is the only module that talks
// to localStorage directly, so swapping in a real backend later means changing
// just this file.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ball-knowledge:player';

export interface PlayerState {
  /** Cumulative "ball knowledge" rating (total points earned). */
  totalPoints: number;
  /** Local date string (YYYY-MM-DD) of the last completed quiz, or null. */
  lastPlayedDate: string | null;
  /** Number of daily quizzes completed. */
  quizzesCompleted: number;
}

const DEFAULT_STATE: PlayerState = {
  totalPoints: 0,
  lastPlayedDate: null,
  quizzesCompleted: 0,
};

/** Returns today's date as a local YYYY-MM-DD string. */
export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadPlayer(): PlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<PlayerState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function savePlayer(state: PlayerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures (e.g. private mode). State stays in memory.
  }
}

/** True if the player has already completed today's quiz. */
export function hasPlayedToday(state: PlayerState): boolean {
  return state.lastPlayedDate === todayString();
}

/**
 * DEV helper: clear today's play so the quiz can be replayed.
 * Leaves totalPoints and quizzesCompleted untouched.
 */
export function resetToday(state: PlayerState): PlayerState {
  const next = { ...state, lastPlayedDate: null };
  savePlayer(next);
  return next;
}
