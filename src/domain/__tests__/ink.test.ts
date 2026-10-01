import { describe, expect, it } from "vitest";
import { DEFAULT_BAND_STYLE, DEFAULT_INK, normaliseInk } from "@/domain/palang";

describe("DEFAULT_INK", () => {
  it("is black", () => {
    expect(DEFAULT_INK).toBe("#000000");
  });

  it("is what a fresh session starts with", () => {
    expect(DEFAULT_BAND_STYLE.ink).toBe("#000000");
  });
});

describe("normaliseInk", () => {
  it("accepts a six-digit hex colour", () => {
    expect(normaliseInk("#9B1C1C", DEFAULT_INK)).toBe("#9b1c1c");
  });

  it("lowercases so the readout is stable regardless of the picker", () => {
    expect(normaliseInk("#AABBCC", DEFAULT_INK)).toBe("#aabbcc");
  });

  it("expands three-digit shorthand", () => {
    expect(normaliseInk("#abc", DEFAULT_INK)).toBe("#aabbcc");
  });

  it("falls back rather than drawing an invisible or broken band", () => {
    for (const bad of ["", "red", "#12", "#1234567", "javascript:x", "#xyzxyz"]) {
      expect(normaliseInk(bad, DEFAULT_INK)).toBe(DEFAULT_INK);
    }
  });

  it("tolerates surrounding whitespace from a paste", () => {
    expect(normaliseInk("  #000080  ", DEFAULT_INK)).toBe("#000080");
  });
});
