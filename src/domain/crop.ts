import { cardSize, type Rect } from "@/domain/page";
import { BASE_PIXEL_RATIO } from "@/export/exportScale";

/** Quarter turns clockwise. A card photographed in portrait is lying on its
 *  side; straightening a few degrees of tilt is out of scope. */
export type Rotation = 0 | 90 | 180 | 270;

/** The rotation and card-shaped area of a Scan that fills the card box. Stored
 *  beside the original image, never baked into it, so it can be re-edited.
 *  `area` is in pixels of the image after `rotation` is applied. */
export type Crop = { rotation: Rotation; area: Rect };

/** The shape of the box a card is drawn into. A Crop always has this shape, so
 *  it fills the box exactly rather than being letterboxed or stretched. */
export function cardRatio(): number {
  const { width, height } = cardSize();
  return width / height;
}

/** How far a scan's shape may stray from the card's before the editor opens by
 *  itself. A flatbed scan cropped a little loosely passes; a phone photo does not. */
const CARD_SHAPE_TOLERANCE = 0.1;

/** Whether a fresh upload should open the crop editor straight away. Portrait
 *  always does: a MyKad is landscape, so a portrait image is a photo of one. */
export function needsCrop(width: number, height: number): boolean {
  if (height > width) return true;
  return Math.abs(width / height / cardRatio() - 1) > CARD_SHAPE_TOLERANCE;
}

/** The largest card-shaped area that fits in a width x height image, centred.
 *  Where the editor starts, and where Reset and rotating return to. */
export function defaultCropArea(width: number, height: number): Rect {
  const ratio = cardRatio();
  const byWidth = width / ratio <= height;
  const w = byWidth ? width : height * ratio;
  const h = byWidth ? width / ratio : height;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Pulls a requested area back to one the editor allows: card-shaped, inside
 *  the photo, no wider than the photo allows and no narrower than the card box
 *  at 300dpi — any narrower and the export would upscale and print soft. A
 *  photo too small for that cannot zoom in at all. Width wins over height, and
 *  the area keeps its centre while its size changes. */
export function clampCropArea(area: Rect, width: number, height: number): Rect {
  const ratio = cardRatio();
  const largest = defaultCropArea(width, height);
  const sharpest = Math.min(largest.width, cardSize().width * BASE_PIXEL_RATIO);
  const w = clamp(area.width, sharpest, largest.width);
  const h = w === largest.width ? largest.height : w / ratio;
  const cx = area.x + area.width / 2;
  const cy = area.y + area.width / ratio / 2;
  return {
    x: clamp(cx - w / 2, 0, width - w),
    y: clamp(cy - h / 2, 0, height - h),
    width: w,
    height: h,
  };
}

/** Zooms by `factor` (above 1 zooms in) about `focus`, a point in image pixels,
 *  which stays at the same place in the frame — the point between a pinch's
 *  fingers, under the mouse wheel, or the frame's centre for the buttons. At a
 *  zoom limit the zoom stops short and the focus still holds. */
export function zoomCropArea(
  area: Rect,
  factor: number,
  focus: { x: number; y: number },
  width: number,
  height: number,
): Rect {
  const w = clampCropArea({ ...area, width: area.width / factor }, width, height).width;
  const k = w / area.width;
  return clampCropArea(
    {
      x: focus.x - (focus.x - area.x) * k,
      y: focus.y - (focus.y - area.y) * k,
      width: w,
      height: w / cardRatio(),
    },
    width,
    height,
  );
}

export function rotatedSize(
  width: number,
  height: number,
  rotation: Rotation,
): { width: number; height: number } {
  return rotation % 180 === 0 ? { width, height } : { width: height, height: width };
}

/** Upright, framed on the largest centred card-shaped area. */
export function initialCrop(width: number, height: number): Crop {
  return { rotation: 0, area: defaultCropArea(width, height) };
}

/** A quarter turn either way. The framing resets rather than following the
 *  turn: people rotate before they frame, not after. */
export function rotateCrop(crop: Crop, step: 90 | -90, width: number, height: number): Crop {
  const rotation = ((crop.rotation + step + 360) % 360) as Rotation;
  const turned = rotatedSize(width, height, rotation);
  return { rotation, area: defaultCropArea(turned.width, turned.height) };
}

/** Where the card box's image node goes. Konva crops in the original image's
 *  pixels before it rotates, so the area is turned back into those pixels and
 *  the node — drawn sideways for a quarter turn — rotates about its centre
 *  to land upright on the card. */
export type CardImageGeometry = {
  crop: Rect;
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  rotation: Rotation;
};

export function cardImageGeometry(
  { rotation, area }: Crop,
  width: number,
  height: number,
  card: Rect,
): CardImageGeometry {
  const right = area.x + area.width;
  const bottom = area.y + area.height;
  const crop: Rect =
    rotation === 0
      ? area
      : rotation === 90
        ? { x: area.y, y: height - right, width: area.height, height: area.width }
        : rotation === 180
          ? { x: width - right, y: height - bottom, width: area.width, height: area.height }
          : { x: width - bottom, y: area.x, width: area.height, height: area.width };
  const sideways = rotation % 180 !== 0;
  const w = sideways ? card.height : card.width;
  const h = sideways ? card.width : card.height;
  return {
    crop,
    x: card.x + card.width / 2,
    y: card.y + card.height / 2,
    width: w,
    height: h,
    offsetX: w / 2,
    offsetY: h / 2,
    rotation,
  };
}
