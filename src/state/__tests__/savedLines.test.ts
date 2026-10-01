import { beforeEach, describe, expect, it, vi } from "vitest";
import { forgetLine, loadLines, rememberLine, SAVED_LINES_KEY } from "@/state/savedLines";

beforeEach(() => localStorage.clear());

describe("rememberLine", () => {
  it("stores a line and returns the list", () => {
    expect(rememberLine("UNTUK URUSAN BANK SAHAJA")).toEqual(["UNTUK URUSAN BANK SAHAJA"]);
  });

  it("puts the most recent line first", () => {
    rememberLine("FIRST");
    rememberLine("SECOND");
    expect(loadLines()).toEqual(["SECOND", "FIRST"]);
  });

  it("deduplicates case-insensitively, keeping the newest spelling", () => {
    rememberLine("untuk urusan bank");
    rememberLine("UNTUK URUSAN BANK");
    expect(loadLines()).toEqual(["UNTUK URUSAN BANK"]);
  });

  it("caps the list at ten", () => {
    for (let i = 0; i < 15; i++) rememberLine(`line ${i}`);
    expect(loadLines()).toHaveLength(10);
    expect(loadLines()[0]).toBe("line 14");
  });

  it("ignores blank lines", () => {
    rememberLine("   ");
    expect(loadLines()).toEqual([]);
  });
});

describe("forgetLine", () => {
  it("removes one line, case-insensitively", () => {
    rememberLine("KEEP");
    rememberLine("DROP");
    expect(forgetLine("drop")).toEqual(["KEEP"]);
  });
});

describe("storage failures", () => {
  it("returns an empty list when the stored value is corrupt", () => {
    localStorage.setItem(SAVED_LINES_KEY, "{not json");
    expect(loadLines()).toEqual([]);
  });

  it("keeps working when localStorage throws on write", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    expect(() => rememberLine("X")).not.toThrow();
    expect(rememberLine("X")).toEqual(["X"]);
    spy.mockRestore();
  });

  it("keeps working when localStorage throws on read", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    expect(loadLines()).toEqual([]);
    spy.mockRestore();
  });
});
