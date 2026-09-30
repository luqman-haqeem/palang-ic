import { beforeEach, describe, expect, it, vi } from "vitest";
import { forget, loadSaved, remember, SAVED_RECIPIENTS_KEY } from "@/state/savedRecipients";

beforeEach(() => localStorage.clear());

describe("remember", () => {
  it("stores a value and returns it", () => {
    expect(remember("recipient", "Maybank").recipient).toEqual(["Maybank"]);
  });

  it("puts the most recent value first", () => {
    remember("recipient", "Maybank");
    remember("recipient", "Celcom");
    expect(loadSaved().recipient).toEqual(["Celcom", "Maybank"]);
  });

  it("deduplicates case-insensitively, keeping the newest spelling", () => {
    remember("recipient", "maybank");
    remember("recipient", "Maybank");
    expect(loadSaved().recipient).toEqual(["Maybank"]);
  });

  it("caps each field at ten values", () => {
    for (let i = 0; i < 15; i++) remember("purpose", `urusan ${i}`);
    const { purpose } = loadSaved();
    expect(purpose).toHaveLength(10);
    expect(purpose[0]).toBe("urusan 14");
  });

  it("ignores blank values", () => {
    remember("recipient", "   ");
    expect(loadSaved().recipient).toEqual([]);
  });

  it("keeps the two fields independent", () => {
    remember("recipient", "Maybank");
    expect(loadSaved().purpose).toEqual([]);
  });
});

describe("forget", () => {
  it("removes a single value", () => {
    remember("recipient", "Maybank");
    remember("recipient", "Celcom");
    expect(forget("recipient", "Maybank").recipient).toEqual(["Celcom"]);
  });

  it("matches case-insensitively", () => {
    remember("recipient", "Maybank");
    expect(forget("recipient", "MAYBANK").recipient).toEqual([]);
  });
});

describe("storage failures", () => {
  it("returns an empty store when the stored value is corrupt", () => {
    localStorage.setItem(SAVED_RECIPIENTS_KEY, "{not json");
    expect(loadSaved()).toEqual({ recipient: [], purpose: [] });
  });

  it("keeps working when localStorage throws on write", () => {
    // Review Focus 4: private mode or an exceeded quota
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    expect(() => remember("recipient", "Maybank")).not.toThrow();
    expect(remember("recipient", "Maybank").recipient).toEqual(["Maybank"]);
    spy.mockRestore();
  });

  it("keeps working when localStorage throws on read", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    expect(loadSaved()).toEqual({ recipient: [], purpose: [] });
    spy.mockRestore();
  });
});
