import type { CardFace } from "@/domain/page";
import {
  ANGLE_MAX,
  ANGLE_MIN,
  type BandStyle,
  clampCentreToFace,
  DEFAULT_BAND_STYLE,
  DEFAULT_PALANG_TEXT,
  defaultPlacement,
  FONT_MAX,
  FONT_MIN,
  LENGTH_MAX,
  LENGTH_MIN,
  type PalangPlacement,
} from "@/domain/palang";

export type Scan = { width: number; height: number; bitmap: ImageBitmap };

export type SessionState = {
  scans: Partial<Record<CardFace, Scan>>;
  /** Exactly what the user typed. The tool imposes no template and appends no
   *  date — including a date, a recipient, or neither is the user's call. */
  line: string;
  /** Used only for the export filename. */
  date: string;
  placements: Record<CardFace, PalangPlacement>;
  style: BandStyle;
};

export type Action =
  | { type: "setScan"; face: CardFace; scan: Scan }
  | { type: "removeScan"; face: CardFace }
  | { type: "setLine"; line: string }
  | { type: "setDate"; date: string }
  | { type: "setStyle"; patch: Partial<BandStyle> }
  | { type: "setPlacement"; face: CardFace; patch: Partial<PalangPlacement> }
  | { type: "resetPlacement"; face: CardFace }
  | { type: "clearAll"; today: string };

export function initialState(today: string): SessionState {
  return {
    scans: {},
    line: DEFAULT_PALANG_TEXT,
    date: today,
    placements: { front: defaultPlacement("front"), back: defaultPlacement("back") },
    style: { ...DEFAULT_BAND_STYLE },
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "setScan":
      return { ...state, scans: { ...state.scans, [action.face]: action.scan } };

    case "removeScan": {
      const scans = { ...state.scans };
      delete scans[action.face];
      return { ...state, scans };
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
        },
      };
    }

    case "setPlacement": {
      const merged = { ...state.placements[action.face], ...action.patch };
      return {
        ...state,
        placements: {
          ...state.placements,
          [action.face]: clampCentreToFace(action.face, merged),
        },
      };
    }

    case "resetPlacement":
      return {
        ...state,
        placements: { ...state.placements, [action.face]: defaultPlacement(action.face) },
      };

    case "clearAll":
      return initialState(action.today);
  }
}

/** Blank text would draw two red lines with no sentence between them: a Copy
 *  that looks marked while granting no limit on use. The default text is a
 *  complete sentence, so it is exportable as it stands. */
export function canExport(state: SessionState): boolean {
  const hasScan = Boolean(state.scans.front || state.scans.back);
  return hasScan && state.line.trim() !== "";
}
