import { describe, expect, it } from "vitest";
import { DEFAULT_PALANG_TEXT } from "@/domain/palang";
import { canExport, initialState, reducer, type Scan } from "@/state/document";

const TODAY = "2026-10-01";
const fakeScan = (): Scan => ({ width: 856, height: 540, bitmap: {} as ImageBitmap });
const withScan = () =>
  reducer(initialState(TODAY), { type: "setScan", face: "front", scan: fakeScan() });

describe("DEFAULT_PALANG_TEXT", () => {
  it("is a complete sentence, not a fragment to finish", () => {
    expect(DEFAULT_PALANG_TEXT).toBe("UNTUK URUSAN BANK SAHAJA");
  });
});

describe("canExport with the default text", () => {
  it("is true straight away — the default is usable as it stands", () => {
    expect(canExport(withScan())).toBe(true);
  });

  it("is still false once the text is cleared", () => {
    expect(canExport(reducer(withScan(), { type: "setLine", line: "" }))).toBe(false);
  });

  it("is still false for whitespace-only text", () => {
    expect(canExport(reducer(withScan(), { type: "setLine", line: "   " }))).toBe(false);
  });

  it("is false with the default text but no scan", () => {
    expect(canExport(initialState(TODAY))).toBe(false);
  });

  it("accepts wording that looks nothing like the default", () => {
    // Different banks want different formats; nothing about the default is a rule.
    const s = reducer(withScan(), { type: "setLine", line: "SALINAN PENDAFTARAN SEKOLAH 2026" });
    expect(canExport(s)).toBe(true);
  });
});

describe("clearAll", () => {
  it("restores the default text rather than leaving an empty field", () => {
    let s = reducer(withScan(), { type: "setLine", line: "ANYTHING" });
    s = reducer(s, { type: "clearAll", today: TODAY });
    expect(s.line).toBe(DEFAULT_PALANG_TEXT);
  });
});
