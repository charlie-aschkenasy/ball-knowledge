// ===========================================================================
// Game time + drop windows.
//
// Pure helpers. The store/App owns when these are called and what to do after
// (e.g., looping rollDay() once per elapsed day). See PLAN.md "Game time, drop
// windows, daily lock" — the "one rollDay per elapsed day" invariant lives at
// the caller, NOT here.
// ===========================================================================

import { EVENING_DROP_HOUR, MORNING_DROP_HOUR } from '../config';
import type { DropWindow, GameTime, PlayerStats } from '../db/types';

// ---------------------------------------------------------------------------
// Window math
// ---------------------------------------------------------------------------

/** Maps an hour (0–23) to the current drop window. */
export function windowForHour(hour: number): DropWindow {
  if (hour < MORNING_DROP_HOUR) return 'pre';
  if (hour < EVENING_DROP_HOUR) return 'morning';
  return 'evening';
}

/**
 * Seconds remaining in the current window before it changes.
 * Used by Home for the countdown to next drop / window switch.
 *
 * `nowDate` is provided so callers can pass a deterministic time in tests.
 */
export function secondsUntilNextWindowChange(nowDate: Date = new Date()): number {
  const h = nowDate.getHours();
  const m = nowDate.getMinutes();
  const s = nowDate.getSeconds();
  const secsIntoDay = h * 3600 + m * 60 + s;

  if (h < MORNING_DROP_HOUR) return MORNING_DROP_HOUR * 3600 - secsIntoDay;
  if (h < EVENING_DROP_HOUR) return EVENING_DROP_HOUR * 3600 - secsIntoDay;
  return 24 * 3600 - secsIntoDay; // next day's pre window starts at midnight
}

/** Human-readable HH:MM:SS countdown from a seconds value. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

// ---------------------------------------------------------------------------
// Lock
// ---------------------------------------------------------------------------

/** True when the player has completed their daily quiz on the current day. */
export function hasPlayedToday(stats: PlayerStats, time: GameTime): boolean {
  return stats.lastPlayedDay === time.currentDay;
}

/** True when the daily quiz is playable: open window AND not yet played. */
export function canPlayNow(stats: PlayerStats, time: GameTime): boolean {
  const w = time.currentWindow;
  if (w !== 'morning' && w !== 'evening') return false;
  return !hasPlayedToday(stats, time);
}

// ---------------------------------------------------------------------------
// Sim-mode operations (used by Dev panel and seed/backfill)
// ---------------------------------------------------------------------------

/**
 * Sets the window directly (sim mode only). Used by Dev panel to test the
 * different drop states without waiting on a clock.
 */
export function setWindow(time: GameTime, window: DropWindow): GameTime {
  return { ...time, currentWindow: window };
}

/**
 * Single-step day advance. Caller is responsible for invoking the full
 * rollover orchestration (penalty + bot sim + season check) — this only
 * touches `currentDay` and resets the window to the next 'morning' drop.
 */
export function bumpDay(time: GameTime): GameTime {
  return {
    ...time,
    currentDay: time.currentDay + 1,
    currentWindow: 'morning',
  };
}

// ---------------------------------------------------------------------------
// Live-mode helpers
// ---------------------------------------------------------------------------

/**
 * Enters live mode: anchors the current game day to the current real time.
 * From here, ticks read real elapsed minutes to derive game day + window.
 */
export function enterLiveMode(time: GameTime, nowDate: Date = new Date()): GameTime {
  return {
    ...time,
    mode: 'live',
    liveAnchor: {
      realIsoAt: nowDate.toISOString(),
      gameDay: time.currentDay,
    },
  };
}

/**
 * Switches to sim mode and drops the anchor. The current `currentDay` /
 * `currentWindow` are preserved as-is.
 */
export function enterSimMode(time: GameTime): GameTime {
  return { ...time, mode: 'sim', liveAnchor: undefined };
}

/**
 * For live mode: given the current time + real `now`, derive how many game-day
 * boundaries have been crossed since the anchor, and what the window should be
 * after settling.
 *
 * Returns:
 *   { daysElapsed }  — number of full game days to call rollDay() for. May be 0.
 *   { settledTime }  — the updated GameTime after applying `daysElapsed` and
 *                      computing the current window from real-time hour.
 *
 * Caller MUST loop `rollDay()` exactly `daysElapsed` times and then write
 * `settledTime` (with currentDay bumped by `daysElapsed`).
 */
export function projectLiveTick(
  time: GameTime,
  nowDate: Date = new Date(),
): { daysElapsed: number; settledTime: GameTime } {
  if (time.mode !== 'live' || !time.liveAnchor) {
    return { daysElapsed: 0, settledTime: time };
  }

  // Compute calendar days between anchor date and now in LOCAL time so the
  // user's drop windows align with their wall clock.
  const anchor = new Date(time.liveAnchor.realIsoAt);
  const anchorMidnight = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate(),
  );
  const nowMidnight = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
  );
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.max(
    0,
    Math.round((nowMidnight.getTime() - anchorMidnight.getTime()) / ONE_DAY_MS),
  );

  const settledTime: GameTime = {
    ...time,
    currentDay: time.liveAnchor.gameDay + daysElapsed,
    currentWindow: windowForHour(nowDate.getHours()),
  };

  return { daysElapsed, settledTime };
}
