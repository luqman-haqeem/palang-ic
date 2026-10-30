import { type CentreBounds, clampCentre } from "@/domain/copyLayout";

type Point = { x: number; y: number };

/** Where a dragged band may go, in screen px. Konva hands `dragBoundFunc` an
 *  absolute (preview-scaled) position, but `bounds` are in sheet px: clamped
 *  unscaled, the limits would shrink with the preview, and a band on a
 *  phone-width preview would stop short of the sheet edge. So the position is
 *  taken into sheet px through the inverse of `toScreen` — the parent's
 *  absolute transform, as Konva's [a, b, c, d, e, f] matrix — clamped there by
 *  the same `clampCentre` the reducer uses, and mapped back. */
export function boundDragPosition(pos: Point, toScreen: number[], bounds: CentreBounds): Point {
  const [a, b, c, d, e, f] = toScreen;
  const det = a * d - b * c;
  const dx = pos.x - e;
  const dy = pos.y - f;
  const { cx, cy } = clampCentre(bounds, {
    cx: (d * dx - c * dy) / det,
    cy: (a * dy - b * dx) / det,
  });
  return { x: a * cx + c * cy + e, y: b * cx + d * cy + f };
}
