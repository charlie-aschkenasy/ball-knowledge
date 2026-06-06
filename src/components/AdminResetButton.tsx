// ===========================================================================
// Floating admin affordance — wipes the human's `lastPlayedDay` so today's
// quiz is playable again. Mounted in App outside the screen switch so it's
// reachable from anywhere (except during the quiz itself).
// ===========================================================================

import { useState } from 'react';
import { useBKStore, useDB } from '../db/store';

interface Props {
  onReset?: () => void;
}

export default function AdminResetButton({ onReset }: Props) {
  const db = useDB();
  const setDB = useBKStore((s) => s.setDB);
  const [flashed, setFlashed] = useState(false);

  if (!db) return null;

  function reset() {
    if (!db) return;
    setDB({
      ...db,
      stats: db.stats.map((s) =>
        s.playerId === db.humanPlayerId ? { ...s, lastPlayedDay: null } : s,
      ),
    });
    setFlashed(true);
    window.setTimeout(() => setFlashed(false), 900);
    onReset?.();
  }

  return (
    <button
      className={`admin-reset ${flashed ? 'flashed' : ''}`}
      onClick={reset}
      title="Clear today's lastPlayedDay so the quiz unlocks again"
      aria-label="Reset today's quiz"
    >
      ↻ Reset today
    </button>
  );
}
