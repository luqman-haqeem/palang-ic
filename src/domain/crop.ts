import {
  cardSize,
  type Orientation,
  orientationOf,
  type Rect,
  type Size,
  sheetSize,
} from "@/domain/sheet";
import type { DocumentKind } from "@/domain/document";
import { BASE_PIXEL_RATIO } from "@/export/exportScale";

/** Quarter turns clockwise. A card photographed in portrait is lying on its
 *  side; straightening a few degrees of tilt is out of scope. */
export type Rotation = 0 | 90 | 180 | 270;

/** The rotation and the area of a Scan that fills its box: card-shaped for a
 *  Card face, A4-shaped for a Page (see `cropBox`). Stored
 *  beside the original image, never baked into it, so it can be re-edited.
 *  `area` is in pixels of the image after `rotation` is applied.
 *
 *  `orientation` is the frame's, not the photo's: a Page's is the user's
 *  choice, so a document lying upright in a sideways photo is framed portrait
 *  without a quarter turn, and the sheet follows the frame. A card's frame is
 *  always landscape. */
export type Crop = { rotation: Rotation; area: Rect; orientation: Orientation };

/** The shape of the box a card is drawn into. A card's Crop has this shape, so
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

/** The box a Crop fills, in sheet px. A Page's is the A4 sheet in the Crop's
 *  own orientation; a card's is the card box, whatever `orientation` says. */
export function cropBox(kind: DocumentKind, orientation: Orientation): Size {
  return kind === "mykad" ? cardSize() : sheetSize(orientation);
}

/** The shape (width over height) a Crop of `kind` keeps. */
export function cropRatio(kind: DocumentKind, orientation: Orientation): number {
  const box = cropBox(kind, orientation);
  return box.width / box.height;
}

/** The largest area of the kind's shape that fits in a width x height image,
 *  centred. Where the editor starts, and where Reset, rotating and turning the
 *  frame return to. */
export function defaultCropArea(
  width: number,
  height: number,
  kind: DocumentKind,
  orientation: Orientation,
): Rect {
  const ratio = cropRatio(kind, orientation);
  const byWidth = width / ratio <= height;
  const w = byWidth ? width : height * ratio;
  const h = byWidth ? width / ratio : height;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** How sharp the narrowest Crop must still print, in px per sheet px. A card
 *  holds its IC number to 300dpi. A Page is held to 150dpi instead: a phone
 *  photo of a whole document rarely has 300dpi to give once trimmed, and body
 *  text survives 150dpi where a card's small print may not. */
const MIN_PIXEL_RATIO: Record<DocumentKind, number> = {
  mykad: BASE_PIXEL_RATIO,
  page: 150 / 96,
};

/** Pulls a requested area back to one the editor allows: the kind's shape,
 *  inside the photo, no wider than the photo allows and no narrower than the
 *  kind's box at its minimum sharpness (300dpi for a card) — any narrower
 *  and the export would upscale and print soft. A photo too small for that
 *  cannot zoom in at all. Width wins over height, and the area keeps its
 *  centre while its size changes. */
export function clampCropArea(
  area: Rect,
  width: number,
  height: number,
  kind: DocumentKind,
  orientation: Orientation,
): Rect {
  const ratio = cropRatio(kind, orientation);
  const largest = defaultCropArea(width, height, kind, orientation);
  const sharpest = Math.min(
    largest.width,
    cropBox(kind, orientation).width * MIN_PIXEL_RATIO[kind],
  );
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
  kind: DocumentKind,
  orientation: Orientation,
): Rect {
  const w = clampCropArea(
    { ...area, width: area.width / factor },
    width,
    height,
    kind,
    orientation,
  ).width;
  const k = w / area.width;
  return clampCropArea(
    {
      x: focus.x - (focus.x - area.x) * k,
      y: focus.y - (focus.y - area.y) * k,
      width: w,
      height: w / cropRatio(kind, orientation),
    },
    width,
    height,
    kind,
    orientation,
  );
}

/** The photo's size once turned: the area of a Crop is measured in it. */
export function rotatedSize(width: number, height: number, rotation: Rotation): Size {
  return rotation % 180 === 0 ? { width, height } : { width: height, height: width };
}

/** Upright, framed on the largest centred area of the kind's shape. A
 *  Page's frame starts the photo's way up, the likelier guess; the user can
 *  turn it. */
export function initialCrop(width: number, height: number, kind: DocumentKind): Crop {
  const orientation = kind === "mykad" ? "landscape" : orientationOf({ width, height });
  return { rotation: 0, area: defaultCropArea(width, height, kind, orientation), orientation };
}

/** A quarter turn either way, of the photo only: the frame keeps its
 *  orientation. The framing resets rather than following the turn: people
 *  rotate before they frame, not after. */
export function rotateCrop(
  crop: Crop,
  step: 90 | -90,
  width: number,
  height: number,
  kind: DocumentKind,
): Crop {
  const rotation = ((crop.rotation + step + 360) % 360) as Rotation;
  const turned = rotatedSize(width, height, rotation);
  return {
    ...crop,
    rotation,
    area: defaultCropArea(turned.width, turned.height, kind, crop.orientation),
  };
}

/** Turns a Page's frame portrait or landscape over the photo as it is turned,
 *  reframed afresh as a rotation is: the old area has the wrong shape. */
export function setCropOrientation(
  crop: Crop,
  orientation: Orientation,
  width: number,
  height: number,
  kind: DocumentKind,
): Crop {
  const turned = rotatedSize(width, height, crop.rotation);
  return {
    ...crop,
    orientation,
    area: defaultCropArea(turned.width, turned.height, kind, orientation),
  };
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

/** Lays a Crop's area of the photo over `card`, upright. Named for the card
 *  but used for any box a Crop fills, a Page's sheet included. */
export function cardImageGeometry(
  { rotation, area }: Pick<Crop, "rotation" | "area">,
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
