import { useRef, useState } from "react";
import type { CardFace } from "@/domain/page";
import { loadScan } from "@/input/loadScan";
import type { Scan } from "@/state/document";

type Props = {
  face: CardFace;
  scan?: Scan;
  onLoad: (scan: Scan) => void;
  onRemove: () => void;
  onError: (message: string) => void;
};

const LABEL: Record<CardFace, string> = { front: "Front", back: "Back" };

export function Dropzone({ face, scan, onLoad, onRemove, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onLoad(await loadScan(file));
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
        <span className="text-sm font-medium">{LABEL[face]}</span>
        {scan ? (
          <button type="button" onClick={onRemove} className="text-sm text-neutral-500 underline">
            Remove
          </button>
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
