// ===========================================================================
// Zustand store wrapping the DB.
//
// The ONLY place that holds the DB in reactive state and persists to storage.
// Components read via the selector hooks; mutations go through `applyMutation`
// (which passes the current DB to a pure repo/domain function and saves the
// result).
// ===========================================================================

import { create } from 'zustand';
import { buildSeedDB } from '../data/seed';
import { clearDBStorage, loadDBFromStorage, saveDBToStorage } from './storage';
import { getGroup, getHuman, getHumanStats, getPlayer, getStats } from './repo';
import type { DB } from './types';

interface BKState {
  db: DB | null;

  /** Load the persisted DB into state. Returns the loaded DB (or null). */
  load: () => DB | null;

  /**
   * Boot the store: load persisted DB or seed a fresh one. Always returns
   * a DB. Safe to call on every app start.
   */
  boot: () => DB;

  /** Replace the entire DB and persist. Use for seed + reseed. */
  setDB: (db: DB) => void;

  /** Wipe persistence and reseed. Returns the fresh DB. */
  reseed: () => DB;

  /**
   * Apply a pure DB mutation: `fn(db) → nextDB`. Persists and updates state.
   * Throws if no DB is loaded.
   */
  applyMutation: (fn: (db: DB) => DB) => void;
}

export const useBKStore = create<BKState>((set, get) => ({
  db: null,

  load: () => {
    const db = loadDBFromStorage();
    set({ db });
    return db;
  },

  boot: () => {
    const existing = loadDBFromStorage();
    if (existing) {
      set({ db: existing });
      return existing;
    }
    const fresh = buildSeedDB();
    saveDBToStorage(fresh);
    set({ db: fresh });
    return fresh;
  },

  setDB: (db) => {
    saveDBToStorage(db);
    set({ db });
  },

  reseed: () => {
    clearDBStorage();
    const fresh = buildSeedDB();
    saveDBToStorage(fresh);
    set({ db: fresh });
    return fresh;
  },

  applyMutation: (fn) => {
    const db = get().db;
    if (!db) {
      console.warn('[ball-knowledge] applyMutation called with no DB loaded');
      return;
    }
    const next = fn(db);
    saveDBToStorage(next);
    set({ db: next });
  },
}));

// ---------------------------------------------------------------------------
// Selector hooks (kept thin — components subscribe to exactly what they read)
// ---------------------------------------------------------------------------

export function useDB(): DB | null {
  return useBKStore((s) => s.db);
}

export function useHumanProfile() {
  return useBKStore((s) => (s.db ? getHuman(s.db) : null));
}

export function useHumanStats() {
  return useBKStore((s) => (s.db ? getHumanStats(s.db) : null));
}

export function usePlayerProfile(id: string) {
  return useBKStore((s) => (s.db ? getPlayer(s.db, id) : undefined));
}

export function usePlayerStats(id: string | null) {
  return useBKStore((s) => (s.db && id ? getStats(s.db, id) : null));
}

export function useGameTime() {
  return useBKStore((s) => s.db?.time ?? null);
}

export function useSeason() {
  return useBKStore((s) => s.db?.season ?? null);
}

export function useGroup(id: string) {
  return useBKStore((s) => (s.db ? getGroup(s.db, id) : undefined));
}
