import { copyLayout, defaultPlacement, kindSlots, layoutSlot, type SlotId, slotKind } from "@/domain/copyLayout";
import type { Crop } from "@/domain/crop";
import { cardCornerRadius, RADIUS_MAX, RADIUS_MIN } from "@/domain/page";
import {
  ANGLE_MAX,
  ANGLE_MIN,
  type BandStyle,
  DEFAULT_BAND_STYLE,
  DEFAULT_PALANG_TEXT,
  FONT_MAX,
  FONT_MIN,
  DEFAULT_INK,
  LENGTH_MAX,
  LENGTH_MIN,
  normaliseInk,
  OPACITY_MAX,
  OPACITY_MIN,
  type PalangPlacement,
} from "@/domain/palang";

/** `bitmap` is always the original upload; a `crop` frames it at draw time and
 *  is dropped with it, so a new image never inherits the last one's framing. */
export type Scan = { width: number; height: number; bitmap: ImageBitmap; crop?: Crop };

/** What the user is making a Copy of. Always their choice, never guessed from a
 *  Scan: a card and a landscape A4 page are too close in shape to tell apart. */
export type DocumentKind = "mykad" | "page";

/** Both kinds' Scans and Placements are held side by side, keyed by slot, so a
 *  kind switch discards nothing. Only the active kind's slots are drawn. */
export type SessionState = {
  kind: DocumentKind;
  scans: Partial<Record<SlotId, Scan>>;
  /** Exactly what the user typed. The tool imposes no template and appends no
   *  date — including a date, a recipient, or neither is the user's call. */
  line: string;
  /** Used only for the export filename. */
  date: string;
  placements: Record<SlotId, PalangPlacement>;
  /** Shared by both kinds: one palang, one hand. */
  style: BandStyle;
  /** Corner rounding applied to MyKad scans, in page logical px. A Page is
   *  always square. */
  cornerRadius: number;
};

export type Action =
  | { type: "setKind"; kind: DocumentKind }
  | { type: "setScan"; slot: SlotId; scan: Scan }
  | { type: "removeScan"; slot: SlotId }
  | { type: "setCrop"; slot: SlotId; crop: Crop }
  | { type: "setLine"; line: string }
  | { type: "setDate"; date: string }
  | { type: "setStyle"; patch: Partial<BandStyle> }
  | { type: "setCornerRadius"; radius: number }
  | { type: "setPlacement"; slot: SlotId; patch: Partial<PalangPlacement> }
  | { type: "resetPlacement"; slot: SlotId }
  | { type: "clearAll"; today: string };

export function initialState(today: string): SessionState {
  return {
    kind: "mykad",
    scans: {},
    line: DEFAULT_PALANG_TEXT,
    date: today,
    placements: {
      front: defaultPlacement("front"),
      back: defaultPlacement("back"),
      page: defaultPlacement("page"),
    },
    style: { ...DEFAULT_BAND_STYLE },
    cornerRadius: cardCornerRadius(),
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "setKind":
      return { ...state, kind: action.kind };

    case "setScan":
      return { ...state, scans: { ...state.scans, [action.slot]: action.scan } };

    case "removeScan": {
      const scans = { ...state.scans };
      delete scans[action.slot];
      return { ...state, scans };
    }

    case "setCrop": {
      const scan = state.scans[action.slot];
      if (!scan) return state;
      return { ...state, scans: { ...state.scans, [action.slot]: { ...scan, crop: action.crop } } };
    }

    case "setLine":
      return { ...state, line: action.line };

    case "setDate":
      return { ...state, date: action.date };

    case "setStyle": {
      const merged = { ...state.style, ...action.patch };
      return {
        ...state,
        style: {
          angleDeg: clamp(merged.angleDeg, ANGLE_MIN, ANGLE_MAX),
          fontSize: clamp(merged.fontSize, FONT_MIN, FONT_MAX),
          lengthFactor: clamp(merged.lengthFactor, LENGTH_MIN, LENGTH_MAX),
          ink: normaliseInk(merged.ink, DEFAULT_INK),
          opacity: clamp(merged.opacity, OPACITY_MIN, OPACITY_MAX),
        },
      };
    }

    case "setCornerRadius":
      return { ...state, cornerRadius: clamp(action.radius, RADIUS_MIN, RADIUS_MAX) };

    case "setPlacement": {
      const merged = { ...state.placements[action.slot], ...action.patch };
      const placements = { ...state.placements, [action.slot]: merged };
      // Stored exactly where the Copy layout draws it, so state and preview
      // cannot disagree about where the band is.
      const { cx, cy } = layoutSlot(
        copyLayout({ ...state, kind: slotKind(action.slot), placements }),
        action.slot,
      ).band;
      return { ...state, placements: { ...placements, [action.slot]: { cx, cy } } };
    }

    case "resetPlacement":
      return {
        ...state,
        placements: { ...state.placements, [action.slot]: defaultPlacement(action.slot) },
      };

    case "clearAll":
      return initialState(action.today);
  }
}

/** Blank text would draw two red lines with no sentence between them: a Copy
 *  that looks marked while granting no limit on use. The default text is a
 *  complete sentence, so it is exportable as it stands. */
export function canExport(state: SessionState): boolean {
  const hasScan = kindSlots(state.kind).some((slot) => state.scans[slot]);
  return hasScan && state.line.trim() !== "";
}
