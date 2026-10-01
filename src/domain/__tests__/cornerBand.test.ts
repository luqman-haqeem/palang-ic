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
  it("is a 45-degree corner stroke at half the card width", () => {
    expect(DEFAULT_BAND_STYLE).toEqual({ angleDeg: 45, fontSize: 14, lengthFactor: 0.5 });
  });
});

describe("bandGeometry", () => {
  it("takes its length from the card width and the length factor", () => {
    expect(bandGeometry(14, 323, 0.5).length).toBeCloseTo(161.5, 1);
  });

  it("can still span the whole card with overhang at the top of the range", () => {
    expect(bandGeometry(14, 323, LENGTH_MAX).length).toBeGreaterThan(323);
  });

  it("keeps gap and stroke derived from font size alone", () => {
    const g = bandGeometry(14, 323, 0.5);
    expect(g.lineGap).toBeCloseTo(14 * 1.6, 6);
    expect(g.strokeWidth).toBeCloseTo(14 * 0.12, 6);
  });
});

describe("defaultPlacement", () => {
  it("sits in the top-left corner of the front card", () => {
    expect(defaultPlacement("front")).toEqual({ cx: 332, cy: 155 });
  });

  it("sits in the top-left corner of the back card", () => {
    expect(defaultPlacement("back")).toEqual({ cx: 332, cy: 416 });
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

  it("leaves the whole 45-degree band inside the card", () => {
    // At 45 degrees a band of length L needs L/(2*sqrt2) clearance on each axis.
    const { width: cardWidth } = cardSize();
    const { length } = bandGeometry(
      DEFAULT_BAND_STYLE.fontSize,
      cardWidth,
      DEFAULT_BAND_STYLE.lengthFactor,
    );
    const reach = length / (2 * Math.SQRT2);
    for (const face of ["front", "back"] as const) {
      const rect = cardRect(face);
      const { cx, cy } = defaultPlacement(face);
      expect(cx - reach).toBeGreaterThanOrEqual(rect.x);
      expect(cy - reach).toBeGreaterThanOrEqual(rect.y);
      expect(cx + reach).toBeLessThanOrEqual(rect.x + rect.width);
      expect(cy + reach).toBeLessThanOrEqual(rect.y + rect.height);
    }
  });
});

describe("length bounds", () => {
  it("spans from a short corner mark to a full-width cross", () => {
    expect(LENGTH_MIN).toBeLessThan(0.5);
    expect(LENGTH_MAX).toBeGreaterThanOrEqual(1.12);
  });
});
