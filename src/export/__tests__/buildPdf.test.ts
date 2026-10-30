import { describe, expect, it } from "vitest";
import { buildPdfBlob, buildPdfDoc } from "@/export/buildPdf";

// 1x1 white JPEG
const JPEG_1PX =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsL" +
  "DBkSEw8UHRofHh0aHBwcJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPDIzM//bAEMBCQkJDAsMGA0NGDIhHCEy" +
  "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEB" +
  "AxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAA" +
  "AAAAAAAAAAH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

describe("buildPdfDoc", () => {
  it("produces a single A4 portrait page in millimetres", () => {
    const doc = buildPdfDoc(JPEG_1PX, "portrait");
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("produces a single A4 landscape page for a landscape sheet", () => {
    const doc = buildPdfDoc(JPEG_1PX, "landscape");
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(297, 0);
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(210, 0);
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("places the image edge to edge on a landscape page, unstretched", () => {
    // The image's draw matrix, in points: 297 x 210mm is 841.89 x 595.28pt.
    // A portrait-shaped placement here would stretch the Copy.
    const pdf = buildPdfDoc(JPEG_1PX, "landscape").output();
    const [, width, height] = /([\d.]+) 0 0 ([\d.]+) [\d.-]+ [\d.-]+ cm/.exec(pdf) ?? [];
    expect(Number(width)).toBeCloseTo(841.89, 1);
    expect(Number(height)).toBeCloseTo(595.28, 1);
  });

  it("keeps a portrait sheet's image edge to edge on a portrait page", () => {
    const pdf = buildPdfDoc(JPEG_1PX, "portrait").output();
    const [, width, height] = /([\d.]+) 0 0 ([\d.]+) [\d.-]+ [\d.-]+ cm/.exec(pdf) ?? [];
    expect(Number(width)).toBeCloseTo(595.28, 1);
    expect(Number(height)).toBeCloseTo(841.89, 1);
  });
});

describe("buildPdfBlob", () => {
  it("produces a non-trivial PDF, catching a silently blank export", () => {
    const blob = buildPdfBlob(JPEG_1PX, "portrait");
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000);
  });

  it("throws on a data URL that is not a JPEG rather than writing a broken file", () => {
    expect(() => buildPdfBlob("data:text/plain;base64,aGk=", "portrait")).toThrow();
  });
});
