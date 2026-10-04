import { describe, expect, it } from "vitest";
import { cardRect } from "@/domain/page";
import { clampBandCentre, clampCentreToFace } from "@/domain/palang";

describe("clampBandCentre", () => {
  const rect = cardRect("front");

  it("leaves a centre that is already inside untouched", () => {
    expect(clampBandCentre({ cx: 332, cy: 155 }, rect)).toEqual({ cx: 332, cy: 155 });
  });

  it("pulls a centre dragged off the card back to its edge", () => {
    expect(clampBandCentre({ cx: -500, cy: 5000 }, rect)).toEqual({
      cx: rect.x,
      cy: rect.y + rect.height,
    });
  });

  it("clamps the centre only, so the line ends may still overhang", () => {
    expect(clampBandCentre({ cx: rect.x, cy: rect.y }, rect).cx).toBe(rect.x);
  });
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
    const front = cardRect("front");
    const inTheGap = { cx: 332, cy: front.y + front.height + 20 };
    expect(clampCentreToFace("front", inTheGap).cy).toBe(front.y + front.height);
  });

  it("is idempotent, so re-clamping an already-clamped centre changes nothing", () => {
    const once = clampCentreToFace("front", { cx: -50, cy: 9999 });
    expect(clampCentreToFace("front", once)).toEqual(once);
  });
});
