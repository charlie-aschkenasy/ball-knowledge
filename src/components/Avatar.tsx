// ===========================================================================
// Letter-avatar circle with a deterministic color per name. Standalone (no
// game-logic imports) so the real flow doesn't depend on legacy modules.
// ===========================================================================

const AVATAR_COLORS = [
  '#6aaa64', '#c9b458', '#c9303c', '#5e7ce2',
  '#8b5cf6', '#ec4899', '#f97316', '#0ea5e9',
  '#14b8a6', '#a16207',
];

export function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({
  name,
  highlight,
  large,
}: {
  name: string;
  highlight?: boolean;
  large?: boolean;
}) {
  const bg = highlight ? 'var(--accent)' : colorForName(name);
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={`avatar ${large ? 'avatar-lg' : ''}`}
      style={{ background: bg }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
