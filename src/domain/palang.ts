import { cardRect, type CardFace, type Rect } from "@/domain/page";

export const INK = "#9B1C1C";

/** A complete, usable default — exportable exactly as it stands. Not a format:
 *  different banks and agencies want the wording set out differently, so this is
 *  a sensible starting sentence the user overwrites at will. */
export const DEFAULT_PALANG_TEXT = "UNTUK URUSAN BANK SAHAJA";
export const ANGLE_MIN = -45;
export const ANGLE_MAX = 45;
export const FONT_MIN = 8;
export const FONT_MAX = 24;
export const FONT_FLOOR = 6;
export const LENGTH_MIN = 0.25;
export const LENGTH_MAX = 1.2;
export const DEFAULT_ANGLE_DEG = -45;
export const DEFAULT_FONT_SIZE = 13;
export const DEFAULT_LENGTH_FACTOR = 0.55;

/** Where the band's centre sits by default, as a fraction of card width and
 *  height. Tuned by hand against a real MyKad so the band crosses the top-left
 *  corner clear of the photo, name, IC number and date of birth. The band runs
 *  off the corner at this position, which is intended — a palang is a stroke
 *  drawn across a copy, not a graphic fitted inside it. */
const BAND_X_FRACTION = 0.105;
const BAND_Y_FRACTION = 0.196;

/** Where a band sits on its own card face. Position is per-face because the
 *  fields to avoid sit differently on the front and the back. */
export type PalangPlacement = { cx: number; cy: number };

/** Angle, size and length are shared by both faces: one palang, one hand.
 *  `lengthFactor` is a multiple of the card width — 0.5 is a corner stroke,
 *  anything above 1 crosses the whole card and overhangs its edges. */
export type BandStyle = { angleDeg: number; fontSize: number; lengthFactor: number };

export const DEFAULT_BAND_STYLE: BandStyle = {
  angleDeg: DEFAULT_ANGLE_DEG,
  fontSize: DEFAULT_FONT_SIZE,
  lengthFactor: DEFAULT_LENGTH_FACTOR,
};

/** Line gap and stroke width stay derived from font size, so the band's
 *  proportions are locked and no thickness control needs to exist. */
export function bandGeometry(fontSize: number, cardWidth: number, lengthFactor: number) {
  return {
    lineGap: fontSize * 1.6,
    strokeWidth: fontSize * 0.12,
    length: cardWidth * lengthFactor,
  };
}

export function defaultPlacement(face: CardFace): PalangPlacement {
  const rect = cardRect(face);
  return {
    cx: rect.x + Math.round(rect.width * BAND_X_FRACTION),
    cy: rect.y + Math.round(rect.height * BAND_Y_FRACTION),
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

/** Slider bounds for a band's centre: exactly its own card, so the ends of the
 *  slider are the edges of the card and nothing beyond is reachable. */
export function placementBounds(face: CardFace): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const rect = cardRect(face);
  return {
    minX: rect.x,
    maxX: rect.x + rect.width,
    minY: rect.y,
    maxY: rect.y + rect.height,
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
