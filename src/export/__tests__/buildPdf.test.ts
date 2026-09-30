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
    const doc = buildPdfDoc(JPEG_1PX);
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
    expect(doc.getNumberOfPages()).toBe(1);
  });
});

describe("buildPdfBlob", () => {
  it("produces a non-trivial PDF, catching a silently blank export", () => {
    const blob = buildPdfBlob(JPEG_1PX);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000);
  });

  it("throws on a data URL that is not a JPEG rather than writing a broken file", () => {
    expect(() => buildPdfBlob("data:text/plain;base64,aGk=")).toThrow();
  });
});
