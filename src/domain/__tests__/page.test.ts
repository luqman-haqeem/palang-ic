import { describe, expect, it } from "vitest";
import { cardRect, cardSize, containFit, mmToPx, PAGE } from "@/domain/page";

describe("page constants", () => {
  it("is A4 at 96dpi", () => {
    expect(PAGE.widthPx).toBe(794);
    expect(PAGE.heightPx).toBe(1123);
  });

  it("converts mm to px", () => {
    expect(mmToPx(25)).toBe(94);
    expect(mmToPx(15)).toBe(57);
  });

  it("sizes the card at true MyKad dimensions", () => {
    expect(cardSize()).toEqual({ width: 323, height: 204 });
  });
});

describe("cardRect", () => {
  it("places the front face below the top margin, horizontally centred at 235", () => {
    expect(cardRect("front")).toEqual({ x: 235, y: 94, width: 323, height: 204 });
  });

  it("places the back face one gap below the front", () => {
    expect(cardRect("back")).toEqual({ x: 235, y: 355, width: 323, height: 204 });
  });

  it("keeps both faces in the upper portion of the page", () => {
    const back = cardRect("back");
    expect(back.y + back.height).toBeLessThan(PAGE.heightPx);
  });
});

describe("containFit", () => {
  const rect = { x: 235, y: 94, width: 323, height: 204 };

  it("fits a card-shaped image edge to edge", () => {
    const fitted = containFit(856, 540, rect);
    expect(fitted.width).toBeCloseTo(323, 0);
    expect(fitted.x).toBeCloseTo(235, 0);
  });

  it("letterboxes a much taller image rather than cropping it", () => {
    // Review Focus 3: a full A4 sheet scanned with a small card on it
    const fitted = containFit(2480, 3508, rect);
    expect(fitted.height).toBeLessThanOrEqual(204);
    expect(fitted.width).toBeLessThanOrEqual(323);
    expect(fitted.y).toBeGreaterThanOrEqual(94);
    // centred within the card rect
    expect(fitted.x + fitted.width / 2).toBeCloseTo(rect.x + rect.width / 2, 0);
  });

  it("returns a zero-size rect for a zero-dimension image instead of dividing by zero", () => {
    const fitted = containFit(0, 0, rect);
    expect(fitted.width).toBe(0);
    expect(fitted.height).toBe(0);
    expect(Number.isFinite(fitted.x)).toBe(true);
  });
});
