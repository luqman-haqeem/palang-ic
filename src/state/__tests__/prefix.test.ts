import { describe, expect, it } from "vitest";
import { PALANG_PREFIX } from "@/domain/palang";
import { canExport, initialState, reducer, type Scan } from "@/state/document";

const TODAY = "2026-10-01";
const fakeScan = (): Scan => ({ width: 856, height: 540, bitmap: {} as ImageBitmap });
const withScan = () =>
  reducer(initialState(TODAY), { type: "setScan", face: "front", scan: fakeScan() });

describe("PALANG_PREFIX", () => {
  it("is a starting point, not a format: it opens the phrase and stops", () => {
    expect(PALANG_PREFIX).toBe("UNTUK URUSAN ");
  });
});

describe("initialState", () => {
  it("seeds the field with the prefix so there is something to continue from", () => {
    expect(initialState(TODAY).line).toBe(PALANG_PREFIX);
  });
});

describe("canExport with a seeded prefix", () => {
  it("is false when only the prefix is there — nothing has actually been written", () => {
    expect(canExport(withScan())).toBe(false);
  });

  it("is false when the prefix has only trailing whitespace added", () => {
    const s = reducer(withScan(), { type: "setLine", line: `${PALANG_PREFIX}   ` });
    expect(canExport(s)).toBe(false);
  });

  it("is false when the text is cleared entirely", () => {
    const s = reducer(withScan(), { type: "setLine", line: "" });
    expect(canExport(s)).toBe(false);
  });

  it("is true once something follows the prefix", () => {
    const s = reducer(withScan(), { type: "setLine", line: `${PALANG_PREFIX}BANK SAHAJA` });
    expect(canExport(s)).toBe(true);
  });

  it("is true for wording that does not use the prefix at all", () => {
    // Different banks want different formats; the prefix is a nudge, not a rule.
    const s = reducer(withScan(), { type: "setLine", line: "SALINAN UNTUK PENDAFTARAN SEKOLAH" });
    expect(canExport(s)).toBe(true);
  });
});

describe("clearAll", () => {
  it("re-seeds the prefix rather than leaving an empty field", () => {
    let s = reducer(withScan(), { type: "setLine", line: "ANYTHING" });
    s = reducer(s, { type: "clearAll", today: TODAY });
    expect(s.line).toBe(PALANG_PREFIX);
  });
});
