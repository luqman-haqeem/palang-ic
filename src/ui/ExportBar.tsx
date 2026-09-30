type Props = {
  disabled: boolean;
  disabledReason: string | null;
  onExportPng: () => void;
  onExportPdf: () => void;
  onClearAll: () => void;
};

export function ExportBar({
  disabled,
  disabledReason,
  onExportPng,
  onExportPdf,
  onClearAll,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onExportPng}
          className="flex-1 rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:bg-neutral-300"
        >
          Export PNG
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onExportPdf}
          className="flex-1 rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:bg-neutral-300"
        >
          Export PDF
        </button>
      </div>
      {disabled && disabledReason && <p className="text-xs text-neutral-500">{disabledReason}</p>}
      <button type="button" onClick={onClearAll} className="text-xs underline">
        Clear all
      </button>
    </div>
  );
}
