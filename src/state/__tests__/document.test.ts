import { beforeEach, describe, expect, it } from "vitest";
import { cardRect } from "@/domain/page";
import { DEFAULT_BAND_STYLE, defaultPlacement, PALANG_PREFIX } from "@/domain/palang";
import { canExport, initialState, reducer, type Scan } from "@/state/document";
import { SAVED_LINES_KEY } from "@/state/savedLines";

const TODAY = "2026-10-01";
const fakeScan = (width = 856, height = 540): Scan =>
  ({ width, height, bitmap: {} as ImageBitmap });

beforeEach(() => localStorage.clear());

describe("initialState", () => {
  it("starts with no scans, the seeded prefix, default placements and one shared style", () => {
    const s = initialState(TODAY);
    expect(s.scans).toEqual({});
    expect(s.line).toBe(PALANG_PREFIX);
    expect(s.date).toBe(TODAY);
    expect(s.placements.front).toEqual(defaultPlacement("front"));
    expect(s.placements.back).toEqual(defaultPlacement("back"));
    expect(s.style).toEqual(DEFAULT_BAND_STYLE);
  });
});

describe("setLine", () => {
  it("stores the text exactly as typed, imposing no template", () => {
    const s = reducer(initialState(TODAY), {
      type: "setLine",
      line: "untuk urusan pinjaman Maybank sahaja",
    });
    expect(s.line).toBe("untuk urusan pinjaman Maybank sahaja");
  });

  it("does not append a date — the user decides whether to include one", () => {
    const s = reducer(initialState(TODAY), { type: "setLine", line: "UNTUK BANK SAHAJA" });
    expect(s.line).toBe("UNTUK BANK SAHAJA");
    expect(s.line).not.toContain("2026");
  });
});

describe("setStyle", () => {
  it("applies one angle to both faces", () => {
    const s = reducer(initialState(TODAY), { type: "setStyle", patch: { angleDeg: -30 } });
    expect(s.style.angleDeg).toBe(-30);
    expect(s.placements.front).toEqual(defaultPlacement("front"));
  });

  it("clamps angle and font size to their ranges", () => {
    const s = reducer(initialState(TODAY), {
      type: "setStyle",
      patch: { angleDeg: 999, fontSize: 999 },
    });
    expect(s.style).toEqual({ angleDeg: 45, fontSize: 24 });
  });
});

describe("placements", () => {
  it("clamps a dragged centre to its own card", () => {
    const s = reducer(initialState(TODAY), {
      type: "setPlacement",
      face: "front",
      patch: { cx: -999, cy: -999 },
    });
    const rect = cardRect("front");
    expect(s.placements.front).toEqual({ cx: rect.x, cy: rect.y });
  });

  it("moves one face without moving the other", () => {
    const s = reducer(initialState(TODAY), {
      type: "setPlacement",
      face: "back",
      patch: { cx: 300 },
    });
    expect(s.placements.back.cx).toBe(300);
    expect(s.placements.front).toEqual(defaultPlacement("front"));
  });

  it("resets only the requested face", () => {
    let s = reducer(initialState(TODAY), { type: "setPlacement", face: "front", patch: { cx: 300 } });
    s = reducer(s, { type: "setPlacement", face: "back", patch: { cx: 300 } });
    s = reducer(s, { type: "resetPlacement", face: "front" });
    expect(s.placements.front).toEqual(defaultPlacement("front"));
    expect(s.placements.back.cx).toBe(300);
  });
});

describe("scans", () => {
  it("adds and removes one face without touching the other", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setScan", face: "back", scan: fakeScan() });
    s = reducer(s, { type: "removeScan", face: "back" });
    expect(s.scans.front).toBeDefined();
    expect(s.scans.back).toBeUndefined();
  });

  it("keeps a face's placement when its scan is replaced", () => {
    let s = reducer(initialState(TODAY), { type: "setPlacement", face: "front", patch: { cx: 300 } });
    s = reducer(s, { type: "setScan", face: "front", scan: fakeScan() });
    expect(s.placements.front.cx).toBe(300);
  });
});

describe("setDate", () => {
  it("updates the date used for the filename", () => {
    const s = reducer(initialState("2026-09-30"), { type: "setDate", date: "2026-10-01" });
    expect(s.date).toBe("2026-10-01");
  });

  it("leaves the palang text alone, since the date is no longer part of it", () => {
    let s = reducer(initialState("2026-09-30"), { type: "setLine", line: "MY WORDING" });
    s = reducer(s, { type: "setDate", date: "2026-10-01" });
    expect(s.line).toBe("MY WORDING");
  });
});

describe("canExport", () => {
  it("is false with no scan", () => {
    const s = reducer(initialState(TODAY), { type: "setLine", line: "UNTUK BANK SAHAJA" });
    expect(canExport(s)).toBe(false);
  });

  it("is false with a scan but no text", () => {
    const s = reducer(initialState(TODAY), { type: "setScan", face: "front", scan: fakeScan() });
    expect(canExport(s)).toBe(false);
  });

  it("is false when the text is only whitespace", () => {
    // Two red lines with no sentence between them looks marked while granting
    // no limit on use, which is worse than no palang at all.
    let s = reducer(initialState(TODAY), { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setLine", line: "    " });
    expect(canExport(s)).toBe(false);
  });

  it("is true with one scan and some text", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setLine", line: "UNTUK BANK SAHAJA" });
    expect(canExport(s)).toBe(true);
  });
});

describe("clearAll", () => {
  it("returns to the initial state", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setLine", line: "X" });
    s = reducer(s, { type: "clearAll", today: TODAY });
    expect(s).toEqual(initialState(TODAY));
  });
});

describe("persistence invariant", () => {
  it("writes nothing to localStorage when scans and text are set", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setScan", face: "back", scan: fakeScan() });
    s = reducer(s, { type: "setLine", line: "UNTUK BANK SAHAJA" });

    const keys = Object.keys(localStorage);
    expect(keys.filter((k) => k !== SAVED_LINES_KEY)).toEqual([]);
    for (const key of keys) {
      const value = localStorage.getItem(key) ?? "";
      expect(value).not.toContain("data:image");
      expect(value).not.toContain("base64");
    }
  });
});
