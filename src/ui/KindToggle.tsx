import type { DocumentKind } from "@/domain/document";

type Props = {
  kind: DocumentKind;
  onChange: (kind: DocumentKind) => void;
};

const OPTIONS: { kind: DocumentKind; label: string }[] = [
  { kind: "mykad", label: "MyKad" },
  { kind: "page", label: "Page" },
];

/** The user always says what they are copying: a card and a landscape page are
 *  too close in shape to guess from the Scan. Switching discards nothing. */
export function KindToggle({ kind, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Document"
      className="flex rounded border border-neutral-300 p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.kind}
          type="button"
          role="radio"
          aria-checked={kind === option.kind}
          onClick={() => onChange(option.kind)}
          className={`flex-1 rounded px-3 py-1 text-sm ${
            kind === option.kind ? "bg-neutral-900 text-white" : "text-neutral-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
