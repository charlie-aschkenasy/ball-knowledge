// ===========================================================================
// "It's live" reveal overlay. Counts 3 → 2 → 1 and then hands off to the quiz.
// ~1.5 seconds total. The motion budget says spend big here — this is the
// daily-drop moment.
// ===========================================================================

import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

const SEQUENCE: (number | string)[] = [3, 2, 1, 'GO'];
const STEP_MS = 450;

export default function DropReveal({ onDone }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= SEQUENCE.length) {
      onDone();
      return;
    }
    const id = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [step, onDone]);

  if (step >= SEQUENCE.length) return null;

  return (
    <div className="drop-reveal" role="status" aria-live="polite">
      <span className="label">Drop live</span>
      <span key={step} className="count">
        {SEQUENCE[step]}
      </span>
    </div>
  );
}
