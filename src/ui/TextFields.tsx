import type { PalangText } from "@/domain/palang";
import type { SavedStore, SuggestionField } from "@/state/savedRecipients";

type Props = {
  text: PalangText;
  saved: SavedStore;
  onField: (field: SuggestionField, value: string) => void;
  onEditLine: (line: string) => void;
  onResetLine: () => void;
  onForget: (field: SuggestionField, value: string) => void;
};

const FIELDS: { field: SuggestionField; label: string; placeholder: string }[] = [
  { field: "purpose", label: "Purpose", placeholder: "pinjaman peribadi" },
  { field: "recipient", label: "Recipient", placeholder: "Maybank" },
];

export function TextFields({ text, saved, onField, onEditLine, onResetLine, onForget }: Props) {
  return (
    <div className="space-y-3">
      {FIELDS.map(({ field, label, placeholder }) => (
        <div key={field}>
          <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input
              list={`${field}-suggestions`}
              value={text[field]}
              placeholder={placeholder}
              onChange={(e) => onField(field, e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-2 py-1"
            />
          </label>
          <datalist id={`${field}-suggestions`}>
            {saved[field].map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          {saved[field].length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {saved[field].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onForget(field, v)}
                  title={`Forget "${v}"`}
                  className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600"
                >
                  {v} ×
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <label className="block">
        <span className="flex items-center justify-between text-sm font-medium">
          Palang text
          {text.detached && (
            <button type="button" onClick={onResetLine} className="text-xs underline">
              Reset to template
            </button>
          )}
        </span>
        <textarea
          value={text.line}
          onChange={(e) => onEditLine(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <span className="text-xs text-neutral-500">
          {text.detached
            ? "Edited by hand — fields no longer update this."
            : "Built from the fields above."}
        </span>
      </label>
    </div>
  );
}
