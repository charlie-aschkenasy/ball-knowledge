// ===========================================================================
// Two-option segmented control. Used for Lifetime / Seasonal toggle.
// ===========================================================================

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: [Option<T>, Option<T>];
  value: T;
  onChange: (next: T) => void;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="segmented" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-pressed={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
