import { beforeEach, describe, expect, it } from "vitest";
import { cardRect } from "@/domain/page";
import { defaultPlacement } from "@/domain/palang";
import { canExport, initialState, reducer, type Scan } from "@/state/document";
import { SAVED_RECIPIENTS_KEY } from "@/state/savedRecipients";

const TODAY = "2026-09-30";
const fakeScan = (width = 856, height = 540): Scan =>
  ({ width, height, bitmap: {} as ImageBitmap });

beforeEach(() => localStorage.clear());

describe("initialState", () => {
  it("starts with no scans and default placements", () => {
    const s = initialState(TODAY);
    expect(s.scans).toEqual({});
    expect(s.placements.front).toEqual(defaultPlacement("front"));
    expect(s.placements.back).toEqual(defaultPlacement("back"));
  });

  it("starts attached to the template", () => {
    expect(initialState(TODAY).text.detached).toBe(false);
  });
});

describe("text fields and detaching", () => {
  it("recomposes the line when a field changes", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setField", field: "recipient", value: "Maybank" });
    s = reducer(s, { type: "setField", field: "purpose", value: "pinjaman peribadi" });
    expect(s.text.line).toBe("UNTUK URUSAN PINJAMAN PERIBADI MAYBANK SAHAJA — 30/09/2026");
  });

  it("detaches on the first manual edit", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "editLine", line: "CUSTOM WORDING" });
    expect(s.text.detached).toBe(true);
    expect(s.text.line).toBe("CUSTOM WORDING");
  });

  it("stops recomposing once detached, so a manual edit survives a field change", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "editLine", line: "CUSTOM WORDING" });
    s = reducer(s, { type: "setField", field: "recipient", value: "Celcom" });
    expect(s.text.line).toBe("CUSTOM WORDING");
    expect(s.text.recipient).toBe("Celcom");
  });

  it("recomposes and reattaches on reset", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setField", field: "recipient", value: "Maybank" });
    s = reducer(s, { type: "setField", field: "purpose", value: "urusan telco" });
    s = reducer(s, { type: "editLine", line: "CUSTOM" });
    s = reducer(s, { type: "resetLine" });
    expect(s.text.detached).toBe(false);
    expect(s.text.line).toContain("MAYBANK SAHAJA");
  });
});

describe("scans", () => {
  it("adds and removes a scan for one face without touching the other", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setScan", face: "back", scan: fakeScan() });
    s = reducer(s, { type: "removeScan", face: "back" });
    expect(s.scans.front).toBeDefined();
    expect(s.scans.back).toBeUndefined();
  });

  it("keeps a face's placement when its scan is replaced", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setPlacement", face: "front", patch: { angleDeg: -30 } });
    s = reducer(s, { type: "setScan", face: "front", scan: fakeScan() });
    expect(s.placements.front.angleDeg).toBe(-30);
  });
});

describe("placements", () => {
  it("clamps a dragged centre to its own card", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setPlacement", face: "front", patch: { cx: -999, cy: -999 } });
    const rect = cardRect("front");
    expect(s.placements.front.cx).toBe(rect.x);
    expect(s.placements.front.cy).toBe(rect.y);
  });

  it("clamps angle and font size to their ranges", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setPlacement", face: "back", patch: { angleDeg: 999, fontSize: 999 } });
    expect(s.placements.back.angleDeg).toBe(45);
    expect(s.placements.back.fontSize).toBe(24);
  });

  it("resets only the requested face", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setPlacement", face: "front", patch: { angleDeg: -40 } });
    s = reducer(s, { type: "setPlacement", face: "back", patch: { angleDeg: 40 } });
    s = reducer(s, { type: "resetPlacement", face: "front" });
    expect(s.placements.front).toEqual(defaultPlacement("front"));
    expect(s.placements.back.angleDeg).toBe(40);
  });
});

describe("canExport", () => {
  it("is false with no scan", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setField", field: "recipient", value: "Maybank" });
    s = reducer(s, { type: "setField", field: "purpose", value: "urusan telco" });
    expect(canExport(s)).toBe(false);
  });

  it("is false when recipient or purpose is blank", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setField", field: "recipient", value: "   " });
    s = reducer(s, { type: "setField", field: "purpose", value: "urusan telco" });
    expect(canExport(s)).toBe(false);
  });

  it("is true with one scan and both fields filled", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setField", field: "recipient", value: "Maybank" });
    s = reducer(s, { type: "setField", field: "purpose", value: "urusan telco" });
    expect(canExport(s)).toBe(true);
  });
});

describe("clearAll", () => {
  it("returns to the initial state", () => {
    let s = initialState(TODAY);
    s = reducer(s, { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setField", field: "recipient", value: "Maybank" });
    s = reducer(s, { type: "clearAll", today: TODAY });
    expect(s).toEqual(initialState(TODAY));
  });
});

describe("persistence invariant", () => {
  it("writes nothing to localStorage when scans and fields are set", () => {
    // The spec's central privacy guarantee: scans live in memory only.
    let s = initialState(TODAY);
    s = reducer(s, { type: "setScan", face: "front", scan: fakeScan() });
    s = reducer(s, { type: "setScan", face: "back", scan: fakeScan() });
    s = reducer(s, { type: "setField", field: "recipient", value: "Maybank" });

    const keys = Object.keys(localStorage);
    expect(keys.filter((k) => k !== SAVED_RECIPIENTS_KEY)).toEqual([]);
    for (const key of keys) {
      const value = localStorage.getItem(key) ?? "";
      expect(value).not.toContain("data:image");
      expect(value).not.toContain("base64");
    }
  });
});
