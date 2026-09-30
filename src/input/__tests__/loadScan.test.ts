import { describe, expect, it } from "vitest";
import {
  ACCEPTED_TYPES,
  downscaleTarget,
  MAX_EDGE,
  REJECT_MESSAGE,
  validateFile,
} from "@/input/loadScan";

describe("validateFile", () => {
  it("accepts the three image types the spec allows", () => {
    for (const type of ACCEPTED_TYPES) {
      expect(validateFile({ type })).toEqual({ ok: true });
    }
    expect(ACCEPTED_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });

  it("rejects a PDF with a message that says what to do instead", () => {
    const result = validateFile({ type: "application/pdf" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(REJECT_MESSAGE);
      expect(result.message).toMatch(/JPEG/);
      expect(result.message).toMatch(/PDF/);
    }
  });

  it("rejects HEIC, which browsers other than Safari cannot decode", () => {
    expect(validateFile({ type: "image/heic" }).ok).toBe(false);
  });

  it("rejects a file with no type at all", () => {
    expect(validateFile({ type: "" }).ok).toBe(false);
  });
});

describe("downscaleTarget", () => {
  it("leaves a small image alone", () => {
    expect(downscaleTarget(1600, 1000)).toEqual({ width: 1600, height: 1000 });
  });

  it("scales a wide image so its longest edge is the maximum", () => {
    expect(downscaleTarget(4000, 2500)).toEqual({ width: 2000, height: 1250 });
  });

  it("scales a tall image by its height", () => {
    const { width, height } = downscaleTarget(2500, 4000);
    expect(height).toBe(MAX_EDGE);
    expect(width).toBe(1250);
  });

  it("never returns a zero dimension for a very lopsided image", () => {
    const { width, height } = downscaleTarget(8000, 3);
    expect(width).toBe(MAX_EDGE);
    expect(height).toBeGreaterThanOrEqual(1);
  });
});
