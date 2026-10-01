import { describe, expect, it } from "vitest";
import { formatSettingsSummary } from "@/domain/settingsSummary";

const style = { angleDeg: -45, fontSize: 14, lengthFactor: 0.5, ink: "#000000" };
const placements = { front: { cx: 306, cy: 155 }, back: { cx: 306, cy: 416 } };

describe("formatSettingsSummary", () => {
  it("reports every value needed to hardcode the current look as a default", () => {
    expect(formatSettingsSummary(style, placements)).toBe(
      "angleDeg -45 | lengthFactor 0.5 | fontSize 14 | ink #000000 | front 306,155 | back 306,416",
    );
  });

  it("rounds positions to whole pixels, since placement is stored in page px", () => {
    const dragged = { front: { cx: 306.7, cy: 155.2 }, back: { cx: 300.4, cy: 415.6 } };
    expect(formatSettingsSummary(style, dragged)).toContain("front 307,155");
    expect(formatSettingsSummary(style, dragged)).toContain("back 300,416");
  });

  it("keeps the length factor readable rather than printing float noise", () => {
    const slid = { ...style, lengthFactor: 0.65000000000000002 };
    expect(formatSettingsSummary(slid, placements)).toContain("lengthFactor 0.65");
  });

  it("shows a negative angle with its sign, so it can be pasted straight in", () => {
    expect(formatSettingsSummary({ ...style, angleDeg: -30 }, placements)).toContain(
      "angleDeg -30",
    );
  });
});
