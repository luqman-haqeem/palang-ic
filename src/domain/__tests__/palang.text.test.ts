import { describe, expect, it } from "vitest";
import { composeLine, fitFontSize, formatDate, FONT_FLOOR } from "@/domain/palang";

describe("formatDate", () => {
  it("renders ISO dates as DD/MM/YYYY", () => {
    expect(formatDate("2026-09-30")).toBe("30/09/2026");
  });

  it("keeps single-digit days and months zero-padded", () => {
    // Review Focus 5
    expect(formatDate("2026-01-05")).toBe("05/01/2026");
  });

  it("does not shift the day across timezones", () => {
    // Review Focus 5: a Date-based implementation can render the previous day
    // for a UTC-midnight ISO date when the runtime is west of UTC.
    expect(formatDate("2026-01-01")).toBe("01/01/2026");
    expect(formatDate("2026-12-31")).toBe("31/12/2026");
  });
});

describe("composeLine", () => {
  const base = { recipient: "Maybank", purpose: "pinjaman peribadi", date: "2026-09-30" };

  it("composes the restrictive Malay sentence in upper case", () => {
    expect(composeLine(base)).toBe(
      "UNTUK URUSAN PINJAMAN PERIBADI MAYBANK SAHAJA — 30/09/2026",
    );
  });

  it("trims stray whitespace from the fields", () => {
    expect(composeLine({ ...base, recipient: "  Maybank  " })).toContain("MAYBANK SAHAJA");
  });

  it("always contains the scope-limiting words", () => {
    const line = composeLine(base);
    expect(line.startsWith("UNTUK URUSAN ")).toBe(true);
    expect(line).toContain(" SAHAJA ");
  });
});

describe("fitFontSize", () => {
  // Deterministic fake measurer: width is proportional to length and size.
  const measure = (text: string, size: number) => text.length * size * 0.5;

  it("keeps the requested size when the text already fits", () => {
    expect(fitFontSize("SHORT", 1000, 14, FONT_FLOOR, measure)).toBe(14);
  });

  it("shrinks until the text fits the band", () => {
    const line = "A".repeat(60);
    const maxWidth = 300;
    const size = fitFontSize(line, maxWidth, 14, FONT_FLOOR, measure);
    expect(size).toBeLessThan(14);
    expect(measure(line, size)).toBeLessThanOrEqual(maxWidth);
  });

  it("stops at the floor for text that can never fit, without looping forever", () => {
    // Review Focus 2: a very long purpose phrase
    const line = "UNTUK URUSAN PEMBIAYAAN PERUMAHAN BANK KERJASAMA RAKYAT MALAYSIA BERHAD SAHAJA — 30/09/2026";
    const size = fitFontSize(line, 10, 24, FONT_FLOOR, measure);
    expect(size).toBe(FONT_FLOOR);
  });

  it("never returns a size below the floor", () => {
    expect(fitFontSize("X".repeat(500), 1, 24, FONT_FLOOR, measure)).toBeGreaterThanOrEqual(
      FONT_FLOOR,
    );
  });
});
