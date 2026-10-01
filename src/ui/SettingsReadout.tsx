import { useState } from "react";
import type { CardFace } from "@/domain/page";
import type { BandStyle, PalangPlacement } from "@/domain/palang";
import { formatSettingsSummary } from "@/domain/settingsSummary";

type Props = {
  style: BandStyle;
  placements: Record<CardFace, PalangPlacement>;
};

/** Shows the exact numbers behind the current look, so a placement tuned by
 *  dragging can be read off and hardcoded as the default. */
export function SettingsReadout({ style, placements }: Props) {
  const summary = formatSettingsSummary(style, placements);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <details className="rounded border border-neutral-200 p-2">
      <summary className="cursor-pointer text-xs text-neutral-600">Current values</summary>
      <p className="mt-2 font-mono text-[11px] leading-relaxed break-all text-neutral-700">
        {summary}
      </p>
      <button type="button" onClick={() => void copy()} className="mt-1 text-xs underline">
        {copied ? "Copied" : "Copy"}
      </button>
      <p className="mt-1 text-[11px] text-neutral-500">
        Drag and slide until it looks right, then copy this line to have it baked in as the
        default.
      </p>
    </details>
  );
}
