import { cardRect, type CardFace, type Rect } from "@/domain/page";

export const INK = "#9B1C1C";

/** A starting point for the palang text, not a format. Different banks and
 *  agencies want the wording set out differently, so the tool opens the phrase
 *  and leaves the rest — including whether to name a date — to the user. */
export const PALANG_PREFIX = "UNTUK URUSAN ";
export const ANGLE_MIN = -45;
export const ANGLE_MAX = 45;
export const FONT_MIN = 8;
export const FONT_MAX = 24;
export const FONT_FLOOR = 6;
export const BAND_OVERHANG = 1.12;
export const DEFAULT_ANGLE_DEG = -12;
export const DEFAULT_FONT_SIZE = 14;

/** Fraction of card height at which the band sits by default. The lower portion
 *  holds the address block, the field least likely to need to stay legible. */
const BAND_HEIGHT_FRACTION = 0.72;

/** Where a band sits on its own card face. Position is per-face because the
 *  fields to avoid sit differently on the front and the back. */
export type PalangPlacement = { cx: number; cy: number };

/** Angle and size are shared by both bands: one palang, one hand. */
export type BandStyle = { angleDeg: number; fontSize: number };

export const DEFAULT_BAND_STYLE: BandStyle = {
  angleDeg: DEFAULT_ANGLE_DEG,
  fontSize: DEFAULT_FONT_SIZE,
};

/** Everything but the stored four values is derived, so the band's proportions
 *  stay locked and no thickness control needs to exist. */
export function bandGeometry(fontSize: number, cardWidth: number) {
  return {
    lineGap: fontSize * 1.6,
    strokeWidth: fontSize * 0.12,
    length: cardWidth * BAND_OVERHANG,
  };
}

export function defaultPlacement(face: CardFace): PalangPlacement {
  const rect = cardRect(face);
  return {
    cx: Math.floor(rect.x + rect.width / 2),
    cy: rect.y + Math.round(rect.height * BAND_HEIGHT_FRACTION),
  };
}

/** Clamps the band's centre to its own card. The line ends are deliberately
 *  unconstrained, so the overhang survives while a band can never end up
 *  floating in the page margin marking nothing. */
export function clampBandCentre(
  centre: { cx: number; cy: number },
  rect: Rect,
): { cx: number; cy: number } {
  return {
    cx: Math.min(Math.max(centre.cx, rect.x), rect.x + rect.width),
    cy: Math.min(Math.max(centre.cy, rect.y), rect.y + rect.height),
  };
}

/** The same clamp, addressed by face, so a Konva `dragBoundFunc` and the reducer
 *  can share one tested implementation. A reducer clamp alone is not enough: for
 *  a controlled react-konva node, a clamped value equal to the one already in
 *  state is not re-applied to the node, leaving the band where it was dropped. */
export function clampCentreToFace(
  face: CardFace,
  centre: { cx: number; cy: number },
): { cx: number; cy: number } {
  return clampBandCentre(centre, cardRect(face));
}

/** Shrinks the text until it fits the band, with a floor below which it is
 *  allowed to overflow rather than become unreadable. The measurer is injected
 *  so this stays testable without a canvas. */
export function fitFontSize(
  line: string,
  maxWidth: number,
  startSize: number,
  floor: number,
  measure: (text: string, size: number) => number,
): number {
  let size = startSize;
  while (size > floor && measure(line, size) > maxWidth) {
    size -= 1;
  }
  return Math.max(size, floor);
}
