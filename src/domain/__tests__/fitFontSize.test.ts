import { describe, expect, it } from "vitest";
import { fitFontSize, FONT_FLOOR } from "@/domain/palang";

// Deterministic fake measurer: width is proportional to length and size.
const measure = (text: string, size: number) => text.length * size * 0.5;

describe("fitFontSize", () => {
  it("keeps the requested size when the text already fits", () => {
    expect(fitFontSize("SHORT", 1000, 14, FONT_FLOOR, measure)).toBe(14);
  });

  it("shrinks until the text fits the band", () => {
    const line = "A".repeat(60);
    const size = fitFontSize(line, 300, 14, FONT_FLOOR, measure);
    expect(size).toBeLessThan(14);
    expect(measure(line, size)).toBeLessThanOrEqual(300);
  });

  it("stops at the floor for text that can never fit, without looping forever", () => {
    const line = "UNTUK URUSAN PEMBIAYAAN PERUMAHAN BANK KERJASAMA RAKYAT MALAYSIA BERHAD SAHAJA";
    expect(fitFontSize(line, 10, 24, FONT_FLOOR, measure)).toBe(FONT_FLOOR);
  });

  it("never returns a size below the floor", () => {
    expect(fitFontSize("X".repeat(500), 1, 24, FONT_FLOOR, measure)).toBeGreaterThanOrEqual(
      FONT_FLOOR,
    );
  });
});
