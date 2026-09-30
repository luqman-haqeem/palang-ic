import { cardRect, type CardFace } from "@/domain/page";
import {
  ANGLE_MAX,
  ANGLE_MIN,
  clampBandCentre,
  composeLine,
  defaultPlacement,
  FONT_MAX,
  FONT_MIN,
  type PalangPlacement,
  type PalangText,
} from "@/domain/palang";

export type Scan = { width: number; height: number; bitmap: ImageBitmap };

export type SessionState = {
  scans: Partial<Record<CardFace, Scan>>;
  text: PalangText;
  placements: Record<CardFace, PalangPlacement>;
};

export type Action =
  | { type: "setScan"; face: CardFace; scan: Scan }
  | { type: "removeScan"; face: CardFace }
  | { type: "setField"; field: "recipient" | "purpose"; value: string }
  | { type: "editLine"; line: string }
  | { type: "resetLine" }
  | { type: "setPlacement"; face: CardFace; patch: Partial<PalangPlacement> }
  | { type: "setDate"; date: string }
  | { type: "resetPlacement"; face: CardFace }
  | { type: "clearAll"; today: string };

export function initialState(today: string): SessionState {
  const text: PalangText = {
    recipient: "",
    purpose: "",
    date: today,
    line: "",
    detached: false,
  };
  return {
    scans: {},
    text: { ...text, line: composeLine(text) },
    placements: { front: defaultPlacement("front"), back: defaultPlacement("back") },
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function applyPatch(
  current: PalangPlacement,
  patch: Partial<PalangPlacement>,
  face: CardFace,
): PalangPlacement {
  const merged = { ...current, ...patch };
  const centre = clampBandCentre({ cx: merged.cx, cy: merged.cy }, cardRect(face));
  return {
    cx: centre.cx,
    cy: centre.cy,
    angleDeg: clamp(merged.angleDeg, ANGLE_MIN, ANGLE_MAX),
    fontSize: clamp(merged.fontSize, FONT_MIN, FONT_MAX),
  };
}

function withText(state: SessionState, text: PalangText): SessionState {
  return { ...state, text: text.detached ? text : { ...text, line: composeLine(text) } };
}

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "setScan":
      return { ...state, scans: { ...state.scans, [action.face]: action.scan } };

    case "removeScan": {
      const scans = { ...state.scans };
      delete scans[action.face];
      return { ...state, scans };
    }

    case "setField":
      return withText(state, { ...state.text, [action.field]: action.value });

    case "editLine":
      return { ...state, text: { ...state.text, line: action.line, detached: true } };

    case "resetLine":
      return withText(state, { ...state.text, detached: false });

    case "setDate":
      return withText(state, { ...state.text, date: action.date });

    case "setPlacement":
      return {
        ...state,
        placements: {
          ...state.placements,
          [action.face]: applyPatch(state.placements[action.face], action.patch, action.face),
        },
      };

    case "resetPlacement":
      return {
        ...state,
        placements: { ...state.placements, [action.face]: defaultPlacement(action.face) },
      };

    case "clearAll":
      return initialState(action.today);
  }
}

/** A Copy that looks marked while granting no limit on use is worse than no
 *  palang at all, so both doors are closed: the fields must compose a sentence,
 *  and whatever is actually about to be drawn must not be blank. The second
 *  check is the one that matters once the line has been detached by hand. */
export function canExport(state: SessionState): boolean {
  const hasScan = Boolean(state.scans.front || state.scans.back);
  if (!hasScan || state.text.line.trim() === "") return false;
  return state.text.recipient.trim() !== "" && state.text.purpose.trim() !== "";
}
