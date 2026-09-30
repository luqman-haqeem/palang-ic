import { describe, expect, it } from "vitest";
import { exportFilename, slugRecipient } from "@/domain/filename";

describe("slugRecipient", () => {
  it("lowercases and hyphenates", () => {
    expect(slugRecipient("Maybank")).toBe("maybank");
  });

  it("collapses punctuation and spaces into single hyphens", () => {
    // Review Focus 1
    expect(slugRecipient("Bank Rakyat (M) Bhd")).toBe("bank-rakyat-m-bhd");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugRecipient("  ...Celcom!  ")).toBe("celcom");
  });

  it("falls back to a placeholder when nothing survives slugging", () => {
    // Review Focus 1: otherwise the filename becomes salinan--2026-09-30.pdf
    expect(slugRecipient("!!!")).toBe("penerima");
    expect(slugRecipient("")).toBe("penerima");
  });

  it("strips accents rather than dropping the letters", () => {
    expect(slugRecipient("Café Bhd")).toBe("cafe-bhd");
  });
});

describe("exportFilename", () => {
  it("builds a sortable name carrying recipient and date", () => {
    expect(exportFilename("Maybank", "2026-09-30", "pdf")).toBe("salinan-maybank-2026-09-30.pdf");
  });

  it("uses the requested extension", () => {
    expect(exportFilename("Maybank", "2026-09-30", "png")).toBe("salinan-maybank-2026-09-30.png");
  });

  it("never produces a double hyphen from an unslugabble recipient", () => {
    expect(exportFilename("???", "2026-09-30", "pdf")).not.toContain("--");
  });
});
