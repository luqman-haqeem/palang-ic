import { describe, expect, it } from "vitest";
import {
  ACCEPTED_TYPES,
  downscaleTarget,
  MAX_EDGE,
  maxEdgeFor,
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

  it("keeps a 12MP phone photo whole, so a crop of the card keeps its detail", () => {
    expect(downscaleTarget(4000, 3000)).toEqual({ width: 4000, height: 3000 });
  });

  it("scales a wide image so its longest edge is the maximum", () => {
    expect(downscaleTarget(8192, 6144)).toEqual({ width: 4096, height: 3072 });
  });

  it("scales a tall image by its height", () => {
    const { width, height } = downscaleTarget(6144, 8192);
    expect(height).toBe(MAX_EDGE);
    expect(width).toBe(3072);
  });

  it("never returns a zero dimension for a very lopsided image", () => {
    const { width, height } = downscaleTarget(8000, 3);
    expect(width).toBe(MAX_EDGE);
    expect(height).toBeGreaterThanOrEqual(1);
  });
});

describe("maxEdgeFor", () => {
  // A4 is 297mm on its long edge: 297 / 25.4 * 300 ≈ 3508px at 300dpi.
  const A4_LONG_EDGE_300DPI = 3508;

  it("keeps a full A4-at-300dpi Page Scan at its original size", () => {
    const page = maxEdgeFor("page");
    expect(downscaleTarget(2480, 3508, page)).toEqual({ width: 2480, height: 3508 });
    expect(downscaleTarget(3508, 2480, page)).toEqual({ width: 3508, height: 2480 });
  });

  it("never lets a Page fall below the A4-at-300dpi long edge", () => {
    expect(maxEdgeFor("page")).toBeGreaterThanOrEqual(A4_LONG_EDGE_300DPI);
  });

  it("leaves the MyKad ceiling where it was", () => {
    expect(maxEdgeFor("mykad")).toBe(4096);
  });

  it("downscales an oversized Page Scan to the Page ceiling", () => {
    expect(downscaleTarget(6000, 8000, maxEdgeFor("page"))).toEqual({ width: 3072, height: 4096 });
  });
});
