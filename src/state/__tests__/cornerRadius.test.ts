import { describe, expect, it } from "vitest";
import { cardCornerRadius, RADIUS_MAX, RADIUS_MIN } from "@/domain/page";
import { initialState, reducer } from "@/state/document";

const TODAY = "2026-10-02";

describe("corner radius in session state", () => {
  it("starts at the true ID-1 card radius", () => {
    expect(initialState(TODAY).cornerRadius).toBe(cardCornerRadius());
  });

  it("can be squared off completely", () => {
    const s = reducer(initialState(TODAY), { type: "setCornerRadius", radius: 0 });
    expect(s.cornerRadius).toBe(0);
    expect(RADIUS_MIN).toBe(0);
  });

  it("clamps above the maximum rather than inverting the clip path", () => {
    const s = reducer(initialState(TODAY), { type: "setCornerRadius", radius: 999 });
    expect(s.cornerRadius).toBe(RADIUS_MAX);
  });

  it("clamps a negative radius to zero", () => {
    const s = reducer(initialState(TODAY), { type: "setCornerRadius", radius: -10 });
    expect(s.cornerRadius).toBe(0);
  });

  it("allows the true card radius to be reached exactly from either direction", () => {
    expect(cardCornerRadius()).toBeGreaterThanOrEqual(RADIUS_MIN);
    expect(cardCornerRadius()).toBeLessThanOrEqual(RADIUS_MAX);
  });

  it("is restored by clearAll", () => {
    let s = reducer(initialState(TODAY), { type: "setCornerRadius", radius: 0 });
    s = reducer(s, { type: "clearAll", today: TODAY });
    expect(s.cornerRadius).toBe(cardCornerRadius());
  });
});
