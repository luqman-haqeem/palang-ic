import { describe, expect, it } from "vitest";
import { DEFAULT_BAND_STYLE, defaultPlacement } from "@/domain/palang";

describe("defaultPlacement", () => {
  it("carries only a position now that angle and size are shared", () => {
    expect(defaultPlacement("front")).toEqual({ cx: 396, cy: 241 });
    expect(defaultPlacement("back")).toEqual({ cx: 396, cy: 502 });
  });
});

describe("DEFAULT_BAND_STYLE", () => {
  it("is one shared angle and size for both faces", () => {
    expect(DEFAULT_BAND_STYLE).toEqual({ angleDeg: -12, fontSize: 14 });
  });
});
