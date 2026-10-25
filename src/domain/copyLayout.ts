import { type CardImageGeometry, cardImageGeometry } from "@/domain/crop";
import { cardRect, type CardFace, containFit, PAGE, type Rect } from "@/domain/page";
import { bandGeometry } from "@/domain/palang";
import type { Scan, SessionState } from "@/state/session";

/** A box on the sheet that one Document's Scan is drawn into. */
export type SlotId = CardFace;

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

/** Everything the preview and the export draw, in sheet logical px. */
export type CopyLayout = {
  sheet: { width: number; height: number };
  /** In drawing order. */
  slots: SlotLayout[];
};

const FACES: CardFace[] = ["front", "back"];

/** The single source of the Copy's geometry. Pure, so the preview, the band's
 *  drag limits and the reducer's clamp can all read it and never disagree. */
export function copyLayout(session: SessionState): CopyLayout {
  return {
    sheet: { width: PAGE.widthPx, height: PAGE.heightPx },
    slots: FACES.map((id) => cardSlot(session, id)),
  };
}

export function layoutSlot(layout: CopyLayout, id: SlotId): SlotLayout {
  const slot = layout.slots.find((s) => s.id === id);
  if (!slot) throw new Error(`No ${id} slot on this Copy.`);
  return slot;
}

/** Pulls a centre into `bounds`. Shared by the reducer and the band's drag
 *  bounds, so neither can let a band go where the other would not. */
export function clampCentre(
  bounds: CentreBounds,
  centre: { cx: number; cy: number },
): { cx: number; cy: number } {
  return {
    cx: Math.min(Math.max(centre.cx, bounds.minX), bounds.maxX),
    cy: Math.min(Math.max(centre.cy, bounds.minY), bounds.maxY),
  };
}

function cardSlot(session: SessionState, id: CardFace): SlotLayout {
  const slot = cardRect(id);
  const { box, image } = placeScan(session.scans[id], slot);
  return {
    id,
    slot,
    box,
    cornerRadius: session.cornerRadius,
    image,
    band: cardBand(session, id, slot),
  };
}

/** A MyKad band's centre is held to its own card, while its ends are left free
 *  so it can overhang onto the page: a palang is a stroke drawn across a copy,
 *  not a graphic fitted inside the card. The card sits well inside the sheet,
 *  so an overhanging band still never runs off the Copy. */
function cardBand(session: SessionState, id: CardFace, slot: Rect): BandLayout {
  const { fontSize, lengthFactor } = session.style;
  const bounds: CentreBounds = {
    minX: slot.x,
    maxX: slot.x + slot.width,
    minY: slot.y,
    maxY: slot.y + slot.height,
  };
  return {
    ...clampCentre(bounds, session.placements[id]),
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
