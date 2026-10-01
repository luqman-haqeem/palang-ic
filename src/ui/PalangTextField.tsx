type Props = {
  line: string;
  saved: string[];
  onChange: (line: string) => void;
  onForget: (line: string) => void;
};

/** One free-text field. No template, no auto-date: what you type is what gets
 *  drawn, so including a date or a recipient is your call. */
export function PalangTextField({ line, saved, onChange, onForget }: Props) {
  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium">Palang text</span>
        <textarea
          value={line}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder="UNTUK URUSAN PINJAMAN PERIBADI MAYBANK SAHAJA — 01/10/2026"
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm"
        />
      </label>
      <p className="text-xs text-neutral-500">
        Drawn exactly as typed. State what the copy may be used for, and keep it clear of the
        photo, name, IC number and date of birth.
      </p>
      {saved.length > 0 && (
        <div className="mt-2 space-y-1">
          <span className="text-xs text-neutral-500">Reuse:</span>
          {saved.map((v) => (
            <div key={v} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange(v)}
                className="flex-1 truncate rounded bg-neutral-100 px-1.5 py-0.5 text-left text-xs text-neutral-700"
                title={v}
              >
                {v}
              </button>
              <button
                type="button"
                onClick={() => onForget(v)}
                title={`Forget "${v}"`}
                className="px-1 text-xs text-neutral-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
