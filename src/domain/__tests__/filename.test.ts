import { describe, expect, it } from "vitest";
import { exportFilename } from "@/domain/filename";

describe("exportFilename", () => {
  it("is a generic name plus the date, so the downloads folder sorts by day", () => {
    expect(exportFilename("2026-10-01", "pdf")).toBe("salinan-2026-10-01.pdf");
  });

  it("uses the requested extension", () => {
    expect(exportFilename("2026-10-01", "png")).toBe("salinan-2026-10-01.png");
  });

  it("carries nothing from the palang text, which the user may have left personal", () => {
    expect(exportFilename("2026-01-05", "pdf")).toBe("salinan-2026-01-05.pdf");
  });
});
