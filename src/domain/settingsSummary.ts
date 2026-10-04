import type { CardFace } from "@/domain/page";
import type { BandStyle, PalangPlacement } from "@/domain/palang";

/** A one-line dump of everything that would need to change to make the current
 *  look the built-in default. Exists so the look can be tuned by hand in the UI
 *  and then baked into `domain/palang.ts`, rather than guessed at. */
export function formatSettingsSummary(
  style: BandStyle,
  placements: Record<CardFace, PalangPlacement>,
  cornerRadius: number,
): string {
  const pos = (p: PalangPlacement) => `${Math.round(p.cx)},${Math.round(p.cy)}`;
  return [
    `angleDeg ${style.angleDeg}`,
    `lengthFactor ${Number(style.lengthFactor.toFixed(2))}`,
    `fontSize ${style.fontSize}`,
    `ink ${style.ink}`,
    `opacity ${Number(style.opacity.toFixed(2))}`,
    `front ${pos(placements.front)}`,
    `back ${pos(placements.back)}`,
    `cornerRadius ${cornerRadius}`,
  ].join(" | ");
}
