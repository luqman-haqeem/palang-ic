export const MM_TO_PX = 96 / 25.4;

export const SHEET = { widthMm: 210, heightMm: 297, widthPx: 794, heightPx: 1123 } as const;
export const CARD = { widthMm: 85.6, heightMm: 54 } as const;
/** ISO/IEC 7810 ID-1 corner radius — the same standard that fixes the card at
 *  85.6 x 54mm. A MyKad has rounded corners, so square-cornered scans read as
 *  screenshots rather than copies of a card. */
export const CARD_CORNER_RADIUS_MM = 3.18;
export const TOP_MARGIN_MM = 25;

/** Adjustable range for the scan's corner rounding. Square at 0; the true card
 *  radius sits inside the range so the default is reachable again after a
 *  change. */
export const RADIUS_MIN = 0;
export const RADIUS_MAX = 24;
export const FACE_GAP_MM = 15;

export type CardFace = "front" | "back";
export type Size = { width: number; height: number };
export type Rect = { x: number; y: number } & Size;

/** Which way up the A4 sheet sits. */
export type Orientation = "portrait" | "landscape";

/** Landscape only when wider than tall: a square counts as portrait, the way
 *  the sheet sits by default. */
export function orientationOf({ width, height }: Size): Orientation {
  return width > height ? "landscape" : "portrait";
}

/** A portrait size turned to `orientation`. The one place the sheet's sides
 *  swap, so its px, its mm and a Crop's frame cannot disagree. */
export function oriented(portrait: Size, orientation: Orientation): Size {
  return orientation === "landscape"
    ? { width: portrait.height, height: portrait.width }
    : { width: portrait.width, height: portrait.height };
}

/** The A4 sheet in px, either way up. */
export function sheetSize(orientation: Orientation): Size {
  return oriented({ width: SHEET.widthPx, height: SHEET.heightPx }, orientation);
}

/** Nearest whole pixel. Rounding, not truncation: 15mm is 56.69px and the sheet
 *  layout depends on that being 57. */
export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}

/** Floors rather than rounding: 85.6mm is 323.53px, and a reproduced ID card
 *  rendered a fraction under true size is harmless where over true size
 *  misrepresents the document. */
export function cardSize(): Size {
  return {
    width: Math.floor(CARD.widthMm * MM_TO_PX),
    height: Math.floor(CARD.heightMm * MM_TO_PX),
  };
}

export function cardCornerRadius(): number {
  return mmToPx(CARD_CORNER_RADIUS_MM);
}

/** A radius larger than half the shorter side inverts the rounded-rect path, so
 *  it is capped rather than trusted. */
export function clampCornerRadius(radius: number, width: number, height: number): number {
  return Math.max(0, Math.min(radius, width / 2, height / 2));
}

export function cardRect(face: CardFace): Rect {
  const { width, height } = cardSize();
  const x = Math.floor((SHEET.widthPx - width) / 2);
  const top = mmToPx(TOP_MARGIN_MM);
  const y = face === "front" ? top : top + height + mmToPx(FACE_GAP_MM);
  return { x, y, width, height };
}

/** Scales an image to fit inside `rect` and centres it, never cropping: losing
 *  part of the card matters more than a cosmetic white margin. */
export function containFit(imgW: number, imgH: number, rect: Rect): Rect {
  if (imgW <= 0 || imgH <= 0) return { x: rect.x, y: rect.y, width: 0, height: 0 };
  const scale = Math.min(rect.width / imgW, rect.height / imgH);
  const width = imgW * scale;
  const height = imgH * scale;
  return {
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height,
  };
}
