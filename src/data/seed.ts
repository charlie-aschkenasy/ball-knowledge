// ===========================================================================
// Seed: builds the initial DB on first run (or reseed). 40 bots with shaped
// per-sport skill profiles, 3 private squads, 5 public per-sport arenas, fresh
// stats. Day 1, sim mode, morning window.
//
// Phase 11 adds the 12-day bot-only backfill into this module (see TODO at the
// bottom of buildSeedDB). The structure here doesn't change — only the final
// step where we run rollDay() N times before returning.
// ===========================================================================

import {
  BACKFILL_DAYS,
  DB_SCHEMA_VERSION,
  QUIZ_SIZE,
  SEASON_LENGTH_DAYS,
} from '../config';
import { advanceDays } from '../domain/season';
import { QUESTIONS } from './questions';
import type {
  DB,
  Group,
  PlayerProfile,
  PlayerStats,
  QuestionStat,
  Sport,
} from '../db/types';

// ---------------------------------------------------------------------------
// Constants used by the seed (not the runtime).
// ---------------------------------------------------------------------------

export const HUMAN_ID = 'human-1';
export const HUMAN_NAME = 'You';

const ALL_SPORTS: Sport[] = ['NBA', 'NFL', 'MLB', 'UFC', 'Soccer', 'general'];

/** Per-sport public arenas. 'general' is left out — it's a fallback category. */
const ARENA_SPORTS: Sport[] = ['NBA', 'NFL', 'MLB', 'UFC', 'Soccer'];

// ---------------------------------------------------------------------------
// Bot seed table — name + shape. Skills are sampled from these slots.
// ---------------------------------------------------------------------------

type BotShape =
  | { kind: 'specialist'; primary: Sport; secondary?: Sport; tier: 'high' | 'mid' }
  | { kind: 'generalist' }
  | { kind: 'casual' };

interface BotSeed {
  name: string;
  shape: BotShape;
}

const BOT_SEEDS: BotSeed[] = [
  // ----- NBA specialists -----
  { name: 'CourtVision',   shape: { kind: 'specialist', primary: 'NBA', secondary: 'general', tier: 'high' } },
  { name: 'PaintBeast',    shape: { kind: 'specialist', primary: 'NBA', tier: 'high' } },
  { name: 'PostUpPaulie',  shape: { kind: 'specialist', primary: 'NBA', tier: 'mid' } },
  { name: 'BucketsByFridge', shape: { kind: 'specialist', primary: 'NBA', secondary: 'NFL', tier: 'high' } },
  { name: 'GlassEater',    shape: { kind: 'specialist', primary: 'NBA', tier: 'mid' } },

  // ----- NFL specialists -----
  { name: 'GridironGoat',  shape: { kind: 'specialist', primary: 'NFL', tier: 'high' } },
  { name: 'BlitzBacon',    shape: { kind: 'specialist', primary: 'NFL', tier: 'mid' } },
  { name: 'PocketPasser',  shape: { kind: 'specialist', primary: 'NFL', secondary: 'NBA', tier: 'high' } },
  { name: 'HailMaryHank',  shape: { kind: 'specialist', primary: 'NFL', tier: 'mid' } },
  { name: 'RZAtthe1',      shape: { kind: 'specialist', primary: 'NFL', tier: 'high' } },

  // ----- MLB specialists -----
  { name: 'DiamondDan',    shape: { kind: 'specialist', primary: 'MLB', tier: 'high' } },
  { name: 'BleacherBum27', shape: { kind: 'specialist', primary: 'MLB', secondary: 'general', tier: 'mid' } },
  { name: 'CheeseBomber',  shape: { kind: 'specialist', primary: 'MLB', tier: 'mid' } },
  { name: 'NinthInningNed', shape: { kind: 'specialist', primary: 'MLB', tier: 'high' } },
  { name: 'BackdoorSlider', shape: { kind: 'specialist', primary: 'MLB', secondary: 'NBA', tier: 'high' } },

  // ----- UFC specialists -----
  { name: 'OctagonOracle', shape: { kind: 'specialist', primary: 'UFC', tier: 'high' } },
  { name: 'GroundAndPound', shape: { kind: 'specialist', primary: 'UFC', tier: 'mid' } },
  { name: 'PivotKicker',   shape: { kind: 'specialist', primary: 'UFC', secondary: 'Soccer', tier: 'mid' } },
  { name: 'SubmissionSenpai', shape: { kind: 'specialist', primary: 'UFC', tier: 'high' } },
  { name: 'FootworkFiona', shape: { kind: 'specialist', primary: 'UFC', tier: 'mid' } },

  // ----- Soccer specialists -----
  { name: 'PitchPerfect',  shape: { kind: 'specialist', primary: 'Soccer', tier: 'high' } },
  { name: 'CornerKickKai', shape: { kind: 'specialist', primary: 'Soccer', tier: 'mid' } },
  { name: 'OffsideOlivia', shape: { kind: 'specialist', primary: 'Soccer', secondary: 'UFC', tier: 'high' } },
  { name: 'BicycleKickBob', shape: { kind: 'specialist', primary: 'Soccer', tier: 'mid' } },
  { name: 'TouchlineTed',  shape: { kind: 'specialist', primary: 'Soccer', tier: 'high' } },

  // ----- Generalists -----
  { name: 'FantasyDad',         shape: { kind: 'generalist' } },
  { name: 'CouchCommissioner',  shape: { kind: 'generalist' } },
  { name: 'TheRingMan',         shape: { kind: 'generalist' } },
  { name: 'BarStoolBetty',      shape: { kind: 'generalist' } },
  { name: 'SportsCenterSam',    shape: { kind: 'generalist' } },
  { name: 'HighlightHoarder',   shape: { kind: 'generalist' } },
  { name: 'BoxScoreNerd',       shape: { kind: 'generalist' } },
  { name: 'TheChalkboard',      shape: { kind: 'generalist' } },
  { name: 'StatLineSteph',      shape: { kind: 'generalist' } },
  { name: 'LateNightWatch',     shape: { kind: 'generalist' } },

  // ----- Casuals (lower skill, lower reliability) -----
  { name: 'RookieRiley',     shape: { kind: 'casual' } },
  { name: 'CasualCarl',      shape: { kind: 'casual' } },
  { name: 'WeekendWarrior',  shape: { kind: 'casual' } },
  { name: 'FirstTimeFan',    shape: { kind: 'casual' } },
  { name: 'TheBracketBuster', shape: { kind: 'casual' } },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function emptyStats(playerId: string): PlayerStats {
  return {
    playerId,
    lifetimePoints: 0,
    seasonalScore: 0,
    perSportLifetimePoints: {},
    perSportSeasonalPoints: {},
    streak: 0,
    longestStreak: 0,
    lastPlayedDay: null,
    recentlySeenQuestionIds: [],
    scoreDistribution: new Array(QUIZ_SIZE + 1).fill(0),
  };
}

// ---------------------------------------------------------------------------
// Bot construction
// ---------------------------------------------------------------------------

function buildBot(seed: BotSeed, index: number): PlayerProfile {
  const id = `bot-${index + 1}`;
  const skills: Partial<Record<Sport, number>> = {};
  let reliability = 0;
  let preferredSports: Sport[] = [];

  switch (seed.shape.kind) {
    case 'specialist': {
      const { primary, secondary, tier } = seed.shape;
      ALL_SPORTS.forEach((s) => (skills[s] = rand(0.2, 0.5)));
      skills[primary] = tier === 'high' ? rand(0.85, 0.93) : rand(0.7, 0.82);
      if (secondary) skills[secondary] = rand(0.55, 0.7);
      reliability = tier === 'high' ? rand(0.9, 0.97) : rand(0.78, 0.92);
      preferredSports = secondary ? [primary, secondary] : [primary];
      break;
    }
    case 'generalist': {
      ALL_SPORTS.forEach((s) => (skills[s] = rand(0.55, 0.72)));
      reliability = rand(0.85, 0.95);
      preferredSports = [...ALL_SPORTS];
      break;
    }
    case 'casual': {
      ALL_SPORTS.forEach((s) => (skills[s] = rand(0.3, 0.55)));
      reliability = rand(0.65, 0.85);
      // Casuals lean on one random sport so their plays still cluster
      const lean = pick(ARENA_SPORTS);
      skills[lean] = rand(0.55, 0.7);
      preferredSports = [lean, 'general'];
      break;
    }
  }

  return {
    id,
    name: seed.name,
    isHuman: false,
    preferredSports,
    sportSkills: skills,
    reliability,
  };
}

// ---------------------------------------------------------------------------
// Group construction
// ---------------------------------------------------------------------------

function buildSquads(humanId: string, bots: PlayerProfile[]): Group[] {
  // Three small private squads — each has the human + 4–6 hand-picked bots
  // with varied skill profiles so the boards feel like a real friend group.
  const pickByName = (...names: string[]) =>
    names.map((n) => bots.find((b) => b.name === n)?.id).filter((id): id is string => !!id);

  return [
    {
      id: 'squad-den',
      name: 'Den of Sharks',
      type: 'squad',
      memberIds: [
        humanId,
        ...pickByName('CourtVision', 'PocketPasser', 'OctagonOracle', 'PitchPerfect', 'StatLineSteph'),
      ],
    },
    {
      id: 'squad-living',
      name: 'Living Room',
      type: 'squad',
      memberIds: [
        humanId,
        ...pickByName('FantasyDad', 'BarStoolBetty', 'CasualCarl', 'WeekendWarrior', 'TheChalkboard'),
      ],
    },
    {
      id: 'squad-groupchat',
      name: 'Group Chat 4 Lyfe',
      type: 'squad',
      memberIds: [
        humanId,
        ...pickByName('GridironGoat', 'DiamondDan', 'BucketsByFridge', 'OffsideOlivia', 'SubmissionSenpai', 'BoxScoreNerd'),
      ],
    },
  ];
}

function buildArenas(humanId: string, bots: PlayerProfile[]): Group[] {
  // One per sport. Members = bots whose skill in that sport is above a low
  // threshold (so the arena reflects "people who care about this sport"),
  // plus the human.
  return ARENA_SPORTS.map((sport) => ({
    id: `arena-${sport.toLowerCase()}`,
    name: `${sport} Arena`,
    type: 'arena',
    sport,
    memberIds: [
      humanId,
      ...bots
        .filter((b) => (b.sportSkills?.[sport] ?? 0) >= 0.45)
        .map((b) => b.id),
    ],
  }));
}

// ---------------------------------------------------------------------------
// Top-level seed
// ---------------------------------------------------------------------------

export function buildSeedDB(): DB {
  // Shuffle seeds so bot-1, bot-2, ... isn't a tier ordering. Names stay.
  const seedsForIds = shuffled(BOT_SEEDS);
  const bots = seedsForIds.map(buildBot);

  const human: PlayerProfile = {
    id: HUMAN_ID,
    name: HUMAN_NAME,
    isHuman: true,
    preferredSports: [...ALL_SPORTS],
  };

  const players: PlayerProfile[] = [human, ...bots];
  const stats: PlayerStats[] = players.map((p) => emptyStats(p.id));

  const questionStats: QuestionStat[] = QUESTIONS.map((q) => ({
    questionId: q.id,
    timesShown: 0,
    timesCorrect: 0,
  }));

  const groups: Group[] = [
    ...buildSquads(HUMAN_ID, bots),
    ...buildArenas(HUMAN_ID, bots),
  ];

  const baseDB: DB = {
    schemaVersion: DB_SCHEMA_VERSION,
    humanPlayerId: HUMAN_ID,
    players,
    stats,
    questionStats,
    answers: [],
    groups,
    season: { number: 1, startDay: 1, endDay: 1 + SEASON_LENGTH_DAYS },
    time: { currentDay: 1, currentWindow: 'morning', mode: 'sim' },
  };

  // Backfill: run BACKFILL_DAYS days of bot-only play. The human is exempt
  // from the absence penalty during this stretch via skipHumanPenalty. After
  // backfill, currentDay has advanced; we don't roll it back (that would put
  // bots' lastPlayedDay in the "future" and break the penalty check). Instead
  // we re-anchor the season so the human still gets a full season ahead, and
  // set the window to morning so the user can play immediately.
  const backfilled = advanceDays(baseDB, BACKFILL_DAYS, QUESTIONS, {
    skipHumanPenalty: true,
  });

  const day = backfilled.time.currentDay;
  return {
    ...backfilled,
    time: { ...backfilled.time, currentWindow: 'morning', mode: 'sim' },
    season: { number: 1, startDay: day, endDay: day + SEASON_LENGTH_DAYS },
    // Backfill produced seasonal scores; we keep them so the leaderboard has
    // shape on first open. Lifetime scores were always going to be kept.
  };
}
