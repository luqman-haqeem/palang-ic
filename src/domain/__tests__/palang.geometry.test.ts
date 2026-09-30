import { describe, expect, it } from "vitest";
import { cardRect } from "@/domain/page";
import { bandGeometry, clampBandCentre, defaultPlacement, INK } from "@/domain/palang";

describe("bandGeometry", () => {
  it("derives gap, stroke and length from font size and card width", () => {
    expect(bandGeometry(14, 323)).toEqual({
      lineGap: 14 * 1.6,
      strokeWidth: 14 * 0.12,
      length: 323 * 1.12,
    });
  });

  it("overhangs the card so the lines run past both edges", () => {
    expect(bandGeometry(14, 323).length).toBeGreaterThan(323);
  });
});

describe("defaultPlacement", () => {
  it("matches the spec constants for the front face", () => {
    expect(defaultPlacement("front")).toEqual({ cx: 396, cy: 241, angleDeg: -12, fontSize: 14 });
  });

  it("matches the spec constants for the back face", () => {
    expect(defaultPlacement("back")).toEqual({ cx: 396, cy: 502, angleDeg: -12, fontSize: 14 });
  });

  it("puts the band in the lower portion of its own card", () => {
    for (const face of ["front", "back"] as const) {
      const rect = cardRect(face);
      const { cy } = defaultPlacement(face);
      expect(cy).toBeGreaterThan(rect.y + rect.height / 2);
      expect(cy).toBeLessThan(rect.y + rect.height);
    }
  });
});

describe("clampBandCentre", () => {
  const rect = cardRect("front");

  it("leaves a centre that is already inside untouched", () => {
    expect(clampBandCentre({ cx: 396, cy: 241 }, rect)).toEqual({ cx: 396, cy: 241 });
  });

  it("pulls a centre dragged off the card back to its edge", () => {
    expect(clampBandCentre({ cx: -500, cy: 5000 }, rect)).toEqual({
      cx: rect.x,
      cy: rect.y + rect.height,
    });
  });

  it("clamps the centre only, so the line ends may still overhang", () => {
    const clamped = clampBandCentre({ cx: rect.x, cy: rect.y }, rect);
    expect(clamped.cx).toBe(rect.x);
  });
});

it("uses the spec ink colour", () => {
  expect(INK).toBe("#9B1C1C");
});
