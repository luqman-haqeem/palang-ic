import { describe, expect, it } from "vitest";
import { boundDragPosition } from "@/render/dragBound";

const bounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };

describe("boundDragPosition", () => {
  it("leaves a position inside the bounds where it is", () => {
    expect(boundDragPosition({ x: 40, y: 50 }, [1, 0, 0, 1, 0, 0], bounds)).toEqual({ x: 40, y: 50 });
  });

  it("clamps in sheet px on a preview scaled down and offset on screen", () => {
    // A half-size preview drawn from (10, 20): screen (500, 30) is sheet
    // (980, 20), pulled back to sheet x 100, which is screen x 60.
    const halfSize = [0.5, 0, 0, 0.5, 10, 20];
    expect(boundDragPosition({ x: 500, y: 30 }, halfSize, bounds)).toEqual({ x: 60, y: 30 });
  });

  it("lets a band reach the sheet's far edge on a small preview", () => {
    // Screen x 150 is sheet x 280 on a half-size preview: a clamp of screen px
    // against sheet bounds would stop at screen 100, short of sheet x 100 (60).
    const halfSize = [0.5, 0, 0, 0.5, 10, 20];
    expect(boundDragPosition({ x: 150, y: 20 }, halfSize, bounds).x).toBe(60);
    const twice = [2, 0, 0, 2, 0, 0];
    expect(boundDragPosition({ x: 150, y: 20 }, twice, bounds).x).toBe(150);
  });
});
