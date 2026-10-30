/** Black by default: the mark reads as ink on a photocopy. Configurable, since
 *  some recipients expect a colour that is obviously not part of the original. */
export const DEFAULT_INK = "#000000";

/** A complete, usable default — exportable exactly as it stands. Not a format:
 *  different banks and agencies want the wording set out differently, so this is
 *  a sensible starting sentence the user overwrites at will. */
export const DEFAULT_PALANG_TEXT = "UNTUK URUSAN BANK SAHAJA";
export const ANGLE_MIN = -45;
export const ANGLE_MAX = 45;
export const FONT_MIN = 8;
export const FONT_MAX = 24;
export const FONT_FLOOR = 6;
/** Never 0: a fully transparent band renders a Copy that looks unmarked while
 *  the user believes it is marked. */
export const OPACITY_MIN = 0.15;
export const OPACITY_MAX = 1;
export const DEFAULT_OPACITY = 1;
export const LENGTH_MIN = 0.25;
export const LENGTH_MAX = 1.2;
export const DEFAULT_ANGLE_DEG = -45;
export const DEFAULT_FONT_SIZE = 13;
export const DEFAULT_LENGTH_FACTOR = 0.55;

/** Where a band sits on its own card face. Position is per-face because the
 *  fields to avoid sit differently on the front and the back. */
export type PalangPlacement = { cx: number; cy: number };

/** Angle, size and length are shared by both faces: one palang, one hand.
 *  `lengthFactor` is a multiple of the card width — 0.5 is a corner stroke,
 *  anything above 1 crosses the whole card and overhangs its edges. */
export type BandStyle = {
  angleDeg: number;
  fontSize: number;
  lengthFactor: number;
  ink: string;
  opacity: number;
};

/** Accepts `#rgb` or `#rrggbb`, lowercased; anything else falls back. A bad
 *  value would draw an invisible band or none at all, so it must never reach
 *  the canvas. */
export function normaliseInk(value: string, fallback: string): string {
  const hex = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

export const DEFAULT_BAND_STYLE: BandStyle = {
  angleDeg: DEFAULT_ANGLE_DEG,
  fontSize: DEFAULT_FONT_SIZE,
  lengthFactor: DEFAULT_LENGTH_FACTOR,
  ink: DEFAULT_INK,
  opacity: DEFAULT_OPACITY,
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
