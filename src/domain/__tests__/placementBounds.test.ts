import { describe, expect, it } from "vitest";
import { copyLayout, layoutSlot } from "@/domain/copyLayout";
import { cardRect } from "@/domain/page";
import { initialState } from "@/state/session";

const placementBounds = (face: "front" | "back") =>
  layoutSlot(copyLayout(initialState("2026-10-01")), face).band.bounds;

describe("placement bounds from the Copy layout", () => {
  it("spans exactly the front card, so a slider cannot leave it", () => {
    const rect = cardRect("front");
    expect(placementBounds("front")).toEqual({
      minX: rect.x,
      maxX: rect.x + rect.width,
      minY: rect.y,
      maxY: rect.y + rect.height,
    });
  });

  it("spans exactly the back card", () => {
    const rect = cardRect("back");
    expect(placementBounds("back")).toEqual({
      minX: rect.x,
      maxX: rect.x + rect.width,
      minY: rect.y,
      maxY: rect.y + rect.height,
    });
  });

  it("gives the two faces the same horizontal range but different vertical ones", () => {
    const front = placementBounds("front");
    const back = placementBounds("back");
    expect(front.minX).toBe(back.minX);
    expect(front.maxX).toBe(back.maxX);
    expect(back.minY).toBeGreaterThan(front.maxY);
  });

  it("agrees with the clamp, so the slider ends are reachable and no further", () => {
    const b = placementBounds("front");
    expect(b.maxX - b.minX).toBe(323);
    expect(b.maxY - b.minY).toBe(204);
  });
});
