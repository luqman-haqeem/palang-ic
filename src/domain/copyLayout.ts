import { type CardImageGeometry, cardImageGeometry } from "@/domain/crop";
import {
  cardRect,
  type CardFace,
  cardSize,
  containFit,
  type Orientation,
  orientationOf,
  type Rect,
  type Size,
  sheetSize,
} from "@/domain/sheet";
import { type BandStyle, bandGeometry, type PalangPlacement } from "@/domain/palang";
import type { DocumentKind, Scan } from "@/domain/document";

/** Everything the Copy's geometry depends on: the session less its text and
 *  date, so the domain lays out a Copy without knowing the session's shape. */
export type CopyInput = {
  kind: DocumentKind;
  scans: Partial<Record<SlotId, Scan>>;
  placements: Record<SlotId, PalangPlacement>;
  /** Shared by both kinds: one palang, one hand. */
  style: BandStyle;
  /** Corner rounding applied to MyKad scans, in sheet px. A Page is always
   *  square. */
  cornerRadius: number;
};

/** A box on the sheet that one Document's Scan is drawn into: a Card face on
 *  a MyKad, or the one Page. */
export type SlotId = CardFace | "page";

/** Konva image-node props for a Scan. `crop` is absent when the whole image
 *  is drawn. */
export type ImageNode = Omit<CardImageGeometry, "crop"> & { crop?: Rect };

/** The range a band's centre may sit in. The ends are not bounded by it. */
export type CentreBounds = { minX: number; maxX: number; minY: number; maxY: number };

/** One band as drawn: its centre, already clamped, and its size. The text is
 *  fitted to `length` at draw time, starting from `fontSize`. */
export type BandLayout = {
  cx: number;
  cy: number;
  length: number;
  lineGap: number;
  strokeWidth: number;
  fontSize: number;
  bounds: CentreBounds;
};

export type SlotLayout = {
  id: SlotId;
  /** The slot's box on the sheet, outlined while it has no Scan. */
  slot: Rect;
  /** Where the Document shows on the sheet, and the shape its corners are
   *  rounded on. The slot itself when there is no Scan. */
  box: Rect;
  cornerRadius: number;
  /** Null while the slot has no Scan. */
  image: ImageNode | null;
  /** Laid out even while the slot is empty; the preview just doesn't draw it. */
  band: BandLayout;
};

/** Everything the preview and the export draw, in sheet px. */
export type CopyLayout = {
  sheet: Size;
  /** In drawing order. */
  slots: SlotLayout[];
};

const FACES: CardFace[] = ["front", "back"];

/** The slots a kind draws, in drawing order. */
export function kindSlots(kind: DocumentKind): SlotId[] {
  return kind === "page" ? ["page"] : FACES;
}

export function slotKind(id: SlotId): DocumentKind {
  return id === "page" ? "page" : "mykad";
}

/** The single source of the Copy's geometry. Pure, so the preview, the band's
 *  drag limits and the reducer's clamp can all read it and never disagree.
 *  Lays out the active kind only. */
export function copyLayout(input: CopyInput): CopyLayout {
  if (input.kind === "page") return pageLayout(input);
  return {
    sheet: sheetSize("portrait"),
    slots: FACES.map((id) => cardSlot(input, id)),
  };
}

export function layoutSlot(layout: CopyLayout, id: SlotId): SlotLayout {
  const slot = layout.slots.find((s) => s.id === id);
  if (!slot) throw new Error(`No ${id} slot on this Copy.`);
  return slot;
}

/** Where the band's centre sits by default, as a fraction of card width and
 *  height. Tuned by hand against a real MyKad so the band crosses the top-left
 *  corner clear of the photo, name, IC number and date of birth. The band runs
 *  off the corner at this position, which is intended — a palang is a stroke
 *  drawn across a copy, not a graphic fitted inside it. */
const BAND_X_FRACTION = 0.105;
const BAND_Y_FRACTION = 0.196;

/** A Page's default is a fraction of the document box instead, since nothing
 *  is known about what is printed on it: near the top-left corner, where a
 *  letterhead or margin is likelier than the fields that matter. Unclamped;
 *  the Copy layout pulls it onto the sheet. */
const PAGE_BAND_X_FRACTION = 0.16;
const PAGE_BAND_Y_FRACTION = 0.1;

/** `scan` is the Page's, and is ignored for a Card face. */
export function defaultPlacement(id: SlotId, scan?: Scan): PalangPlacement {
  if (id === "page") {
    const { box } = pageFrame(scan);
    return {
      cx: box.x + box.width * PAGE_BAND_X_FRACTION,
      cy: box.y + box.height * PAGE_BAND_Y_FRACTION,
    };
  }
  const rect = cardRect(id);
  return {
    cx: rect.x + Math.round(rect.width * BAND_X_FRACTION),
    cy: rect.y + Math.round(rect.height * BAND_Y_FRACTION),
  };
}

/** Pulls a centre into `bounds`. The reducer and the band's `dragBoundFunc`
 *  both call it with the same layout's bounds. A reducer clamp alone is not
 *  enough: for a controlled react-konva node, a clamped value equal to the one
 *  already in state is not re-applied to the node, leaving the band where it
 *  was dropped. */
export function clampCentre(
  bounds: CentreBounds,
  centre: { cx: number; cy: number },
): { cx: number; cy: number } {
  return {
    cx: Math.min(Math.max(centre.cx, bounds.minX), bounds.maxX),
    cy: Math.min(Math.max(centre.cy, bounds.minY), bounds.maxY),
  };
}

function cardSlot(input: CopyInput, id: CardFace): SlotLayout {
  const slot = cardRect(id);
  const { box, image } = placeScan(input.scans[id], slot);
  return {
    id,
    slot,
    box,
    cornerRadius: input.cornerRadius,
    image,
    band: cardBand(input, id, slot),
  };
}

/** A MyKad band's centre is held to its own card, while its ends are left free
 *  so it can overhang onto the sheet: a palang is a stroke drawn across a copy,
 *  not a graphic fitted inside the card. The card sits well inside the sheet,
 *  so an overhanging band still never runs off the Copy. */
function cardBand(input: CopyInput, id: CardFace, slot: Rect): BandLayout {
  const { fontSize, lengthFactor } = input.style;
  const bounds: CentreBounds = {
    minX: slot.x,
    maxX: slot.x + slot.width,
    minY: slot.y,
    maxY: slot.y + slot.height,
  };
  return {
    ...clampCentre(bounds, input.placements[id]),
    ...bandGeometry(fontSize, slot.width, lengthFactor),
    fontSize,
    bounds,
  };
}

/** A Crop has the slot's shape, so it fills the slot exactly and the slot is
 *  what gets rounded. An uncropped scan is contain-fitted instead, and rounded
 *  on its own fitted edges: rounding the slot would leave a letterboxed
 *  image's corners square inside it. */
function placeScan(scan: Scan | undefined, slot: Rect): { box: Rect; image: ImageNode | null } {
  if (!scan) return { box: slot, image: null };
  if (scan.crop) {
    return { box: slot, image: cardImageGeometry(scan.crop, scan.width, scan.height, slot) };
  }
  const box = containFit(scan.width, scan.height, slot);
  return { box, image: { ...box, offsetX: 0, offsetY: 0, rotation: 0 } };
}

/** A Page is contain-fitted to the whole sheet, edge to edge: never cropped,
 *  and with no margin, since the Page is the paper. The sheet turns landscape
 *  with a landscape Crop frame, or an uncropped Scan wider than tall, so a
 *  landscape Page is not shrunk onto a portrait sheet. */
function pageLayout(input: CopyInput): CopyLayout {
  const { sheet, slot, box, image } = pageFrame(input.scans.page);
  return {
    sheet,
    slots: [
      { id: "page", slot, box, cornerRadius: 0, image, band: pageBand(input, sheet, box) },
    ],
  };
}

function pageFrame(scan: Scan | undefined) {
  const sheet = sheetSize(pageOrientation(scan));
  const slot: Rect = { x: 0, y: 0, ...sheet };
  return { sheet, slot, ...placeScan(scan, slot) };
}

/** The way up the sheet sits: a Crop's own frame once framed, else the whole
 *  Scan's shape. Portrait while there is no Scan. */
function pageOrientation(scan: Scan | undefined): Orientation {
  if (!scan) return "portrait";
  return scan.crop ? scan.crop.orientation : orientationOf(scan);
}

/** Unlike a card, a Page has no sheet around it to overhang onto, so the whole
 *  band (both lines, both ends, the text) is held on the sheet: a palang is
 *  never cut by the edge of the Copy. Sized by document width over card width,
 *  so it keeps its MyKad proportions. */
function pageBand(
  input: CopyInput,
  sheet: Size,
  doc: Rect,
): BandLayout {
  const { angleDeg, lengthFactor } = input.style;
  const fontSize = input.style.fontSize * (doc.width / cardSize().width);
  const geometry = bandGeometry(fontSize, doc.width, lengthFactor);
  const halfThick = geometry.lineGap / 2 + geometry.strokeWidth / 2;
  const t = (angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(t));
  const sin = Math.abs(Math.sin(t));

  // The longest band whose rotated box fits the sheet at this angle.
  const byWidth = cos > 1e-9 ? (sheet.width - 2 * sin * halfThick) / cos : Infinity;
  const byHeight = sin > 1e-9 ? (sheet.height - 2 * cos * halfThick) / sin : Infinity;
  const length = Math.max(0, Math.min(geometry.length, byWidth, byHeight));

  // Half-extents of the rotated box, which bound the centre on the sheet.
  const ex = cos * (length / 2) + sin * halfThick;
  const ey = sin * (length / 2) + cos * halfThick;
  const [minX, maxX] = centreRange(ex, sheet.width - ex, doc.x, doc.x + doc.width);
  const [minY, maxY] = centreRange(ey, sheet.height - ey, doc.y, doc.y + doc.height);
  const bounds: CentreBounds = { minX, maxX, minY, maxY };

  return {
    ...clampCentre(bounds, input.placements.page),
    ...geometry,
    length,
    fontSize,
    bounds,
  };
}

/** The sheet's range, narrowed to the document's span where the two overlap,
 *  so the centre stays over the Page when it can. A range that has closed up
 *  collapses to its middle. */
function centreRange(lo: number, hi: number, docLo: number, docHi: number): [number, number] {
  const a = Math.max(lo, docLo);
  const b = Math.min(hi, docHi);
  if (a <= b) return [a, b];
  if (lo <= hi) return [lo, hi];
  const mid = (lo + hi) / 2;
  return [mid, mid];
}
