// ===========================================================================
// Canonical type definitions for the entire app.
// Question types AND DB schema live here so there's one source of truth.
// ===========================================================================

// ---------------------------------------------------------------------------
// Question shape (phase 2: multiple_choice only; phase 7 widens to a union)
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Sport = 'NBA' | 'NFL' | 'MLB' | 'UFC' | 'Soccer' | 'general';

export type QuestionType = 'multiple_choice' | 'fill_in_blank' | 'matching';

export interface BaseQuestion {
  id: string;
  text: string;
  /**
   * Author-set bucket used by the daily recipe (until live data overrides
   * via `effectiveDifficulty`). UI-facing.
   */
  difficulty: Difficulty;
  sport: Sport;
  /**
   * HIDDEN authored difficulty in [0, 1]. Interpret as the expected accuracy
   * of a competent fan (skill ≈ 0.7) on this question. Used ONLY by bot
   * pCorrect math — never by the displayed difficulty engine.
   *
   * Why hidden + independent: if bots derived their accuracy from the
   * effective bucket, the engine would just confirm its own labels. With
   * `intrinsic` as ground truth, the engine measures an independent signal.
   */
  intrinsic: number;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[]; // typically 4
  correctIndex: number;
}

export interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill_in_blank';
  /** Acceptable answer variants. All normalized before comparison. */
  acceptableAnswers: string[];
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  /** Left and right are presented separately; player links them. */
  pairs: { left: string; right: string }[];
}

export type Question = MultipleChoiceQuestion | FillInBlankQuestion | MatchingQuestion;

// ---------------------------------------------------------------------------
// Answer values (one variant per format)
// ---------------------------------------------------------------------------

export type AnswerValue =
  | { kind: 'mc'; selectedIndex: number | null }
  | { kind: 'fib'; text: string | null }
  | { kind: 'match'; mapping: Record<string, string> | null };

export interface Answer {
  questionId: string;
  value: AnswerValue;
}

// ---------------------------------------------------------------------------
// Players, stats
// ---------------------------------------------------------------------------

export interface PlayerProfile {
  id: string;
  name: string;
  isHuman: boolean;
  /** Sports the player gravitates toward; used to bias selection. */
  preferredSports: Sport[];
  // Bot-only fields:
  /** 0..1 per sport. Higher = better at that sport. */
  sportSkills?: Partial<Record<Sport, number>>;
  /** 0..1. Chance the bot plays on any given day. */
  reliability?: number;
}

export interface PlayerStats {
  playerId: string;
  /** Monotonic — sum of all points ever earned. */
  lifetimePoints: number;
  /** Resets each season; floor at 0; absence penalty applied here. */
  seasonalScore: number;
  /** Monotonic per-sport totals — preserved for future archive views. */
  perSportLifetimePoints: Partial<Record<Sport, number>>;
  /** Per-sport seasonal totals — drives current "X guy" title holders. */
  perSportSeasonalPoints: Partial<Record<Sport, number>>;
  streak: number;
  longestStreak: number;
  lastPlayedDay: number | null;
  /** Ring buffer of recently-seen question IDs (most recent first). */
  recentlySeenQuestionIds: string[];
}

// ---------------------------------------------------------------------------
// Question stats, answer events
// ---------------------------------------------------------------------------

export interface QuestionStat {
  questionId: string;
  timesShown: number;
  timesCorrect: number;
}

export interface AnswerEvent {
  playerId: string;
  questionId: string;
  day: number;
  wasCorrect: boolean;
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export type GroupType = 'squad' | 'arena';

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  /** Required for arenas (sport-specific public rooms). */
  sport?: Sport;
  memberIds: string[];
}

// ---------------------------------------------------------------------------
// Season + game time
// ---------------------------------------------------------------------------

export interface SeasonState {
  number: number;
  startDay: number;
  endDay: number; // exclusive
}

export type DropWindow = 'pre' | 'morning' | 'evening' | 'closed';

export type TimeMode = 'live' | 'sim';

export interface GameTime {
  currentDay: number; // 1-indexed
  currentWindow: DropWindow;
  mode: TimeMode;
  /** Anchor for live mode: maps a real ISO time to a game day. */
  liveAnchor?: { realIsoAt: string; gameDay: number };
}

// ---------------------------------------------------------------------------
// The DB blob
// ---------------------------------------------------------------------------

export interface DB {
  schemaVersion: 1;
  humanPlayerId: string;
  players: PlayerProfile[];
  stats: PlayerStats[];
  questionStats: QuestionStat[];
  /** Append-only; pruned to last 30 days inside repo.recordAnswerEvent. */
  answers: AnswerEvent[];
  groups: Group[];
  season: SeasonState;
  time: GameTime;
}
