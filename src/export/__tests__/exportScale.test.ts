import { describe, expect, it } from "vitest";
import { SHEET, sheetSize } from "@/domain/sheet";
import { exportedPixelSize, exportPixelRatio } from "@/export/exportScale";

describe("exportPixelRatio", () => {
  it("is 300dpi over 96dpi when the preview is unscaled", () => {
    expect(exportPixelRatio(1)).toBeCloseTo(300 / 96, 6);
  });

  it("compensates for a preview scaled down to fit the viewport", () => {
    // Konva's Stage sizes the export canvas from stage.width(), which is already
    // SHEET.widthPx * scale. Without compensation the Copy comes out at whatever
    // resolution the window happens to imply.
    expect(exportPixelRatio(0.5)).toBeCloseTo((300 / 96) / 0.5, 6);
  });

  it("treats a zero or missing scale as unscaled rather than dividing by zero", () => {
    expect(Number.isFinite(exportPixelRatio(0))).toBe(true);
    expect(exportPixelRatio(0)).toBeCloseTo(300 / 96, 6);
  });
});

describe("exportedPixelSize", () => {
  const A4_AT_300DPI = { width: 2481, height: 3509 };

  it("hits A4 at 300dpi on a full-width desktop preview", () => {
    expect(exportedPixelSize(1, sheetSize("portrait"))).toEqual(A4_AT_300DPI);
  });

  it("hits the same size from a typical desktop holder of 776px", () => {
    // max-w-6xl minus padding, gap and the lg:w-80 aside
    expect(exportedPixelSize(776 / SHEET.widthPx, sheetSize("portrait"))).toEqual(A4_AT_300DPI);
  });

  it("hits the same size from a 360px phone, which previously exported ~124dpi", () => {
    expect(exportedPixelSize(328 / SHEET.widthPx, sheetSize("portrait"))).toEqual(A4_AT_300DPI);
  });

  describe("for a landscape sheet", () => {
    const LANDSCAPE_SHEET = sheetSize("landscape");
    const LANDSCAPE_A4_AT_300DPI = { width: 3509, height: 2481 };

    it("hits landscape A4 at 300dpi on an unscaled preview", () => {
      expect(exportedPixelSize(1, LANDSCAPE_SHEET)).toEqual(LANDSCAPE_A4_AT_300DPI);
    });

    it("hits the same size from a 776px desktop holder", () => {
      // The preview fits the landscape sheet's own width, not the portrait one's.
      expect(exportedPixelSize(776 / SHEET.heightPx, LANDSCAPE_SHEET)).toEqual(
        LANDSCAPE_A4_AT_300DPI,
      );
    });

    it("hits the same size from a 360px phone", () => {
      expect(exportedPixelSize(328 / SHEET.heightPx, LANDSCAPE_SHEET)).toEqual(
        LANDSCAPE_A4_AT_300DPI,
      );
    });
  });
});
