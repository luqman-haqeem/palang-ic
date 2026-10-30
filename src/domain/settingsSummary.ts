import type { SlotId } from "@/domain/copyLayout";
import type { BandStyle, PalangPlacement } from "@/domain/palang";

const ORDER: SlotId[] = ["front", "back", "page"];

/** A one-line dump of everything that would need to change to make the current
 *  look the built-in default. Exists so the look can be tuned by hand in the UI
 *  and then baked into `domain/palang.ts`, rather than guessed at. Positions
 *  are given only for the slots passed in: the ones drawn on this Copy. */
export function formatSettingsSummary(
  style: BandStyle,
  placements: Partial<Record<SlotId, PalangPlacement>>,
  cornerRadius: number,
): string {
  const pos = (p: PalangPlacement) => `${Math.round(p.cx)},${Math.round(p.cy)}`;
  const positions = ORDER.flatMap((id) => {
    const p = placements[id];
    return p ? [`${id} ${pos(p)}`] : [];
  });
  return [
    `angleDeg ${style.angleDeg}`,
    `lengthFactor ${Number(style.lengthFactor.toFixed(2))}`,
    `fontSize ${style.fontSize}`,
    `ink ${style.ink}`,
    `opacity ${Number(style.opacity.toFixed(2))}`,
    ...positions,
    `cornerRadius ${cornerRadius}`,
  ].join(" | ");
}
