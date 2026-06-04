// ===========================================================================
// Animated count-up. Used for the points tally on the Results screen.
// requestAnimationFrame-driven; easing is a soft ease-out so big jumps stay
// satisfying without dragging.
// ===========================================================================

import { useEffect, useState } from 'react';

export function useCountUp(target: number, durationMs = 600): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = target;

    function step(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return display;
}
