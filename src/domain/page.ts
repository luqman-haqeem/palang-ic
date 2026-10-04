export const MM_TO_PX = 96 / 25.4;

export const PAGE = { widthMm: 210, heightMm: 297, widthPx: 794, heightPx: 1123 } as const;
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
export type Rect = { x: number; y: number; width: number; height: number };

/** Nearest whole pixel. Rounding, not truncation: 15mm is 56.69px and the page
 *  layout depends on that being 57. */
export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}

/** Floors rather than rounding: 85.6mm is 323.53px, and a reproduced ID card
 *  rendered a fraction under true size is harmless where over true size
 *  misrepresents the document. */
export function cardSize(): { width: number; height: number } {
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
  const x = Math.floor((PAGE.widthPx - width) / 2);
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
