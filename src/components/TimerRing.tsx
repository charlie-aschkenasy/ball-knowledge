// ===========================================================================
// Circular SVG timer ring. Drains as the countdown runs, switches to red and
// pulses when seconds left ≤ 5. The number in the middle is the current
// remaining seconds.
// ===========================================================================

interface Props {
  secondsLeft: number;
  totalSeconds: number;
}

const SIZE = 72;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export default function TimerRing({ secondsLeft, totalSeconds }: Props) {
  const pct = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const offset = CIRC * (1 - pct);
  const low = secondsLeft <= 5;

  return (
    <div className="timer-ring" aria-label={`${secondsLeft} seconds left`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          className="timer-ring-track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
        />
        <circle
          className={`timer-ring-fill ${low ? 'low' : ''}`}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={`timer-ring-label ${low ? 'low' : ''}`}>{secondsLeft}</div>
    </div>
  );
}
