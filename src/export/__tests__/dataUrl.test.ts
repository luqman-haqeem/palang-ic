import { describe, expect, it } from "vitest";
import { dataUrlToBlob } from "@/export/dataUrl";

describe("dataUrlToBlob", () => {
  it("decodes a png data url into a blob of the right type", async () => {
    const blob = dataUrlToBlob("data:image/png;base64,aGVsbG8=");
    expect(blob.type).toBe("image/png");
    expect(await blob.text()).toBe("hello");
  });

  it("decodes jpeg too", () => {
    expect(dataUrlToBlob("data:image/jpeg;base64,aGk=").type).toBe("image/jpeg");
  });

  it("rejects something that is not a base64 data url", () => {
    // Anchor downloads of multi-megabyte data: URLs are capped in several
    // browsers, so the PNG path goes through a Blob; a malformed input must fail
    // loudly rather than download an empty file.
    expect(() => dataUrlToBlob("https://example.com/x.png")).toThrow();
    expect(() => dataUrlToBlob("data:image/png,notbase64")).toThrow();
  });
});
