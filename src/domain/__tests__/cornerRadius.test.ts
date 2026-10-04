import { describe, expect, it } from "vitest";
import {
  CARD_CORNER_RADIUS_MM,
  cardCornerRadius,
  cardSize,
  clampCornerRadius,
} from "@/domain/page";

describe("CARD_CORNER_RADIUS_MM", () => {
  it("is the ID-1 card radius, like the 85.6x54mm card size itself", () => {
    expect(CARD_CORNER_RADIUS_MM).toBeCloseTo(3.18, 2);
  });
});

describe("cardCornerRadius", () => {
  it("is 12 logical px, the mm radius at 96dpi", () => {
    expect(cardCornerRadius()).toBe(12);
  });

  it("is small relative to the card, a rounded corner rather than a pill", () => {
    const { width, height } = cardSize();
    expect(cardCornerRadius()).toBeLessThan(height / 4);
    expect(cardCornerRadius()).toBeLessThan(width / 4);
  });
});

describe("clampCornerRadius", () => {
  it("leaves a radius that fits alone", () => {
    expect(clampCornerRadius(12, 323, 204)).toBe(12);
  });

  it("never exceeds half the shorter side, which would invert the path", () => {
    expect(clampCornerRadius(12, 10, 204)).toBe(5);
    expect(clampCornerRadius(12, 323, 8)).toBe(4);
  });

  it("is zero for a zero-size rect rather than negative", () => {
    expect(clampCornerRadius(12, 0, 0)).toBe(0);
  });

  it("never returns a negative radius even if given one", () => {
    expect(clampCornerRadius(-5, 323, 204)).toBe(0);
  });
});
