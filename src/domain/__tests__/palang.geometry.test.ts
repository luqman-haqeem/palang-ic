import { describe, expect, it } from "vitest";
import { cardRect } from "@/domain/page";
import {
  bandGeometry,
  clampBandCentre,
  clampCentreToFace,
  defaultPlacement,
  INK,
} from "@/domain/palang";

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
    expect(defaultPlacement("front")).toEqual({ cx: 396, cy: 241 });
  });

  it("matches the spec constants for the back face", () => {
    expect(defaultPlacement("back")).toEqual({ cx: 396, cy: 502 });
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

describe("clampCentreToFace", () => {
  it("clamps to the front card without the caller knowing the rect", () => {
    const rect = cardRect("front");
    expect(clampCentreToFace("front", { cx: -999, cy: -999 })).toEqual({
      cx: rect.x,
      cy: rect.y,
    });
  });

  it("clamps to the back card", () => {
    const rect = cardRect("back");
    expect(clampCentreToFace("back", { cx: 99999, cy: 99999 })).toEqual({
      cx: rect.x + rect.width,
      cy: rect.y + rect.height,
    });
  });

  it("keeps a band dragged into the gap between the faces on its own card", () => {
    // The gap is 57px of page between the two card rects. A band parked there
    // would mark nothing, which is the one outcome the clamp exists to prevent.
    const front = cardRect("front");
    const inTheGap = { cx: 396, cy: front.y + front.height + 20 };
    expect(clampCentreToFace("front", inTheGap).cy).toBe(front.y + front.height);
  });

  it("is idempotent, so re-clamping an already-clamped centre changes nothing", () => {
    const once = clampCentreToFace("front", { cx: -50, cy: 9999 });
    expect(clampCentreToFace("front", once)).toEqual(once);
  });
});
