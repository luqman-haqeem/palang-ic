import { describe, expect, it } from "vitest";
import { DEFAULT_BAND_STYLE, DEFAULT_OPACITY, OPACITY_MAX, OPACITY_MIN } from "@/domain/palang";
import { initialState, reducer } from "@/state/document";

describe("opacity defaults", () => {
  it("starts fully opaque, because a palang is ink rather than a watermark", () => {
    expect(DEFAULT_OPACITY).toBe(1);
    expect(DEFAULT_BAND_STYLE.opacity).toBe(1);
  });

  it("can be faded but never to invisible", () => {
    expect(OPACITY_MIN).toBeGreaterThan(0);
    expect(OPACITY_MAX).toBe(1);
  });
});

describe("setStyle clamps opacity", () => {
  it("refuses a fully transparent band, which would look unmarked", () => {
    const s = reducer(initialState("2026-10-01"), { type: "setStyle", patch: { opacity: 0 } });
    expect(s.style.opacity).toBe(OPACITY_MIN);
  });

  it("refuses values above one", () => {
    const s = reducer(initialState("2026-10-01"), { type: "setStyle", patch: { opacity: 5 } });
    expect(s.style.opacity).toBe(1);
  });

  it("keeps a legitimate mid value", () => {
    const s = reducer(initialState("2026-10-01"), { type: "setStyle", patch: { opacity: 0.6 } });
    expect(s.style.opacity).toBeCloseTo(0.6, 6);
  });
});
