import { useRef, useState } from "react";
import { type SlotId, slotKind } from "@/domain/copyLayout";
import { loadScan } from "@/input/loadScan";
import type { Scan } from "@/state/session";

type Props = {
  slot: SlotId;
  scan?: Scan;
  onLoad: (scan: Scan) => void;
  /** Absent where there is no crop editor for this slot. */
  onEdit?: () => void;
  onRemove: () => void;
  onError: (message: string) => void;
};

const LABEL: Record<SlotId, string> = { front: "Front", back: "Back", page: "Page" };

export function Dropzone({ slot, scan, onLoad, onEdit, onRemove, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onLoad(await loadScan(file, slotKind(slot)));
    } catch (err) {
      onError(err instanceof Error ? err.message : "That image could not be read.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void accept(e.dataTransfer.files[0]);
      }}
      className="rounded border border-dashed border-neutral-300 p-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{LABEL[slot]}</span>
        {scan ? (
          <span className="flex gap-3">
            {onEdit && (
              <button type="button" onClick={onEdit} className="text-sm underline">
                {scan.crop ? "Edit crop" : "Crop"}
              </button>
            )}
            <button type="button" onClick={onRemove} className="text-sm text-neutral-500 underline">
              Remove
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="text-sm underline"
            disabled={busy}
          >
            {busy ? "Loading…" : "Choose file"}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        {scan ? `${scan.width} × ${scan.height}` : "Drop a JPEG, PNG or WebP"}
      </p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void accept(e.target.files?.[0])}
      />
    </div>
  );
}
