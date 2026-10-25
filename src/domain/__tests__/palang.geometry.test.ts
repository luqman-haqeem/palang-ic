import { describe, expect, it } from "vitest";
import { clampCentre, copyLayout, layoutSlot } from "@/domain/copyLayout";
import { cardRect } from "@/domain/page";
import { initialState } from "@/state/session";

const boundsOf = (face: "front" | "back") =>
  layoutSlot(copyLayout(initialState("2026-10-01")), face).band.bounds;

describe("clampCentre", () => {
  const rect = cardRect("front");
  const bounds = boundsOf("front");

  it("leaves a centre that is already inside untouched", () => {
    expect(clampCentre(bounds, { cx: 332, cy: 155 })).toEqual({ cx: 332, cy: 155 });
  });

  it("pulls a centre dragged off the card back to its edge", () => {
    expect(clampCentre(bounds, { cx: -500, cy: 5000 })).toEqual({
      cx: rect.x,
      cy: rect.y + rect.height,
    });
  });

  it("clamps the centre only, so the line ends may still overhang", () => {
    expect(clampCentre(bounds, { cx: rect.x, cy: rect.y }).cx).toBe(rect.x);
  });
});

describe("clampCentre with a face's layout bounds", () => {
  it("clamps to the front card", () => {
    const rect = cardRect("front");
    expect(clampCentre(boundsOf("front"), { cx: -999, cy: -999 })).toEqual({
      cx: rect.x,
      cy: rect.y,
    });
  });

  it("clamps to the back card", () => {
    const rect = cardRect("back");
    expect(clampCentre(boundsOf("back"), { cx: 99999, cy: 99999 })).toEqual({
      cx: rect.x + rect.width,
      cy: rect.y + rect.height,
    });
  });

  it("keeps a band dragged into the gap between the faces on its own card", () => {
    const front = cardRect("front");
    const inTheGap = { cx: 332, cy: front.y + front.height + 20 };
    expect(clampCentre(boundsOf("front"), inTheGap).cy).toBe(front.y + front.height);
  });

  it("is idempotent, so re-clamping an already-clamped centre changes nothing", () => {
    const once = clampCentre(boundsOf("front"), { cx: -50, cy: 9999 });
    expect(clampCentre(boundsOf("front"), once)).toEqual(once);
  });
});
