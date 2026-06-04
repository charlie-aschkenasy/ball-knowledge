// ===========================================================================
// Raw load/save for the single DB blob. The only module that talks to
// `localStorage`. Swap this file to migrate persistence (e.g. to IndexedDB
// or a remote backend) without touching the rest of the app.
// ===========================================================================

import { DB_SCHEMA_VERSION, DB_STORAGE_KEY } from '../config';
import type { DB } from './types';

/** Returns the persisted DB, or null if none exists / parse failed. */
export function loadDBFromStorage(): DB | null {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DB;
    if (parsed.schemaVersion !== DB_SCHEMA_VERSION) {
      // Future migrations would happen here. For now, on mismatch, throw away
      // the old DB and let the seed run.
      console.warn(
        `[ball-knowledge] DB schemaVersion ${parsed.schemaVersion} ≠ ${DB_SCHEMA_VERSION}; reseeding.`,
      );
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('[ball-knowledge] Failed to load DB:', err);
    return null;
  }
}

export function saveDBToStorage(db: DB): void {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    // localStorage can throw in private mode or when full. State stays in
    // memory until the user can retry.
    console.warn('[ball-knowledge] Failed to save DB:', err);
  }
}

export function clearDBStorage(): void {
  try {
    localStorage.removeItem(DB_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
