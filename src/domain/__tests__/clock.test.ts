import { describe, expect, it } from "vitest";
import { isoToday } from "@/domain/clock";

describe("isoToday", () => {
  it("formats the local calendar date as yyyy-mm-dd", () => {
    expect(isoToday(new Date(2026, 8, 30, 14, 0, 0))).toBe("2026-09-30");
  });

  it("zero-pads single-digit months and days", () => {
    expect(isoToday(new Date(2026, 0, 5, 14, 0, 0))).toBe("2026-01-05");
  });

  it("uses the local date, not the UTC date, in the early morning", () => {
    // 07:30 on 1 Oct in UTC+8 is still 30 Sep in UTC. A toISOString()-based
    // implementation stamps the Copy with yesterday for the first 8 hours of
    // every Malaysian day, and the palang's date is what makes SAHAJA checkable.
    const earlyMorning = new Date("2026-09-30T23:30:00Z");
    expect(earlyMorning.toISOString().slice(0, 10)).toBe("2026-09-30");
    expect(isoToday(earlyMorning)).toBe("2026-10-01");
  });

  it("agrees with the runtime's own local-date formatting", () => {
    for (const iso of ["2026-01-01T16:05:00Z", "2026-12-31T15:59:00Z", "2026-06-15T00:00:00Z"]) {
      const d = new Date(iso);
      expect(isoToday(d)).toBe(d.toLocaleDateString("en-CA"));
    }
  });
});
