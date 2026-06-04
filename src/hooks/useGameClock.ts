// ===========================================================================
// Live-mode game clock.
//
// Runs a 30-second interval and a visibilitychange listener while the app is
// in live mode. Calls the provided callback to drive a tick (which the caller
// uses to project the current time + invoke rollDay() for each elapsed day).
//
// Sim mode → no work; the hook just sits idle.
// ===========================================================================

import { useEffect } from 'react';
import type { GameTime } from '../db/types';

/** Frequency of the live-mode tick. The cache window doesn't matter here — we
 * just need to catch wall-clock boundaries within ~30s. */
const TICK_INTERVAL_MS = 30_000;

export function useGameClock(time: GameTime | null, onTick: () => void) {
  useEffect(() => {
    if (!time || time.mode !== 'live') return;

    onTick(); // immediate sync on enter / focus

    const intervalId = window.setInterval(onTick, TICK_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onTick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onTick);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onTick);
    };
    // We deliberately only re-subscribe when mode flips, not on every time
    // change — onTick is expected to be referentially stable via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time?.mode]);
}
