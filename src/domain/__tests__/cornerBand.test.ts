import { describe, expect, it } from "vitest";
import { cardRect, cardSize } from "@/domain/page";
import {
  bandGeometry,
  DEFAULT_BAND_STYLE,
  defaultPlacement,
  LENGTH_MAX,
  LENGTH_MIN,
} from "@/domain/palang";

describe("DEFAULT_BAND_STYLE", () => {
  it("matches the values tuned against a real MyKad", () => {
    expect(DEFAULT_BAND_STYLE).toEqual({
      angleDeg: -45,
      fontSize: 13,
      lengthFactor: 0.55,
      ink: "#000000",
      opacity: 1,
    });
  });
});

describe("bandGeometry", () => {
  it("takes its length from the card width and the length factor", () => {
    expect(bandGeometry(13, 323, 0.55).length).toBeCloseTo(177.65, 1);
  });

  it("can still span the whole card with overhang at the top of the range", () => {
    expect(bandGeometry(14, 323, LENGTH_MAX).length).toBeGreaterThan(323);
  });

  it("keeps gap and stroke derived from font size alone", () => {
    const g = bandGeometry(13, 323, 0.55);
    expect(g.lineGap).toBeCloseTo(13 * 1.6, 6);
    expect(g.strokeWidth).toBeCloseTo(13 * 0.12, 6);
  });
});

describe("defaultPlacement", () => {
  it("sits in the top-left corner of the front card", () => {
    expect(defaultPlacement("front")).toEqual({ cx: 269, cy: 134 });
  });

  it("sits in the top-left corner of the back card", () => {
    expect(defaultPlacement("back")).toEqual({ cx: 269, cy: 395 });
  });

  it("is in the upper-left quadrant of its own card, for both faces", () => {
    for (const face of ["front", "back"] as const) {
      const rect = cardRect(face);
      const { cx, cy } = defaultPlacement(face);
      expect(cx).toBeLessThan(rect.x + rect.width / 2);
      expect(cy).toBeLessThan(rect.y + rect.height / 2);
      expect(cx).toBeGreaterThan(rect.x);
      expect(cy).toBeGreaterThan(rect.y);
    }
  });

  it("deliberately overhangs the top-left corner, like a stroke drawn off the edge", () => {
    // Tuned against a real card: the band runs past the corner rather than
    // stopping inside it. Only the centre is constrained to the card.
    const { width: cardWidth } = cardSize();
    const { length } = bandGeometry(
      DEFAULT_BAND_STYLE.fontSize,
      cardWidth,
      DEFAULT_BAND_STYLE.lengthFactor,
    );
    const reach = length / (2 * Math.SQRT2);
    const rect = cardRect("front");
    const { cx, cy } = defaultPlacement("front");
    expect(cx - reach).toBeLessThan(rect.x);
    expect(cy - reach).toBeLessThan(rect.y);
    // ...while the centre itself stays well inside, which is what the clamp guards.
    expect(cx).toBeGreaterThan(rect.x);
    expect(cy).toBeGreaterThan(rect.y);
  });
});

describe("length bounds", () => {
  it("spans from a short corner mark to a full-width cross", () => {
    expect(LENGTH_MIN).toBeLessThan(0.5);
    expect(LENGTH_MAX).toBeGreaterThanOrEqual(1.12);
  });
});
