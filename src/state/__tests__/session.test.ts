import { beforeEach, describe, expect, it } from "vitest";
import { cardRect } from "@/domain/page";
import { copyLayout, defaultPlacement, layoutSlot } from "@/domain/copyLayout";
import { initialCrop } from "@/domain/crop";
import { DEFAULT_BAND_STYLE, DEFAULT_PALANG_TEXT } from "@/domain/palang";
import { canExport, initialState, reducer, type Scan } from "@/state/session";
import { SAVED_LINES_KEY } from "@/state/savedLines";

const TODAY = "2026-10-01";
const fakeScan = (width = 856, height = 540): Scan =>
  ({ width, height, bitmap: {} as ImageBitmap });

beforeEach(() => localStorage.clear());

describe("initialState", () => {
  it("starts with no scans, the default text, default placements and one shared style", () => {
    const s = initialState(TODAY);
    expect(s.scans).toEqual({});
    expect(s.line).toBe(DEFAULT_PALANG_TEXT);
    expect(s.date).toBe(TODAY);
    expect(s.placements.front).toEqual(defaultPlacement("front"));
    expect(s.placements.back).toEqual(defaultPlacement("back"));
    expect(s.style).toEqual(DEFAULT_BAND_STYLE);
  });
});

describe("setLine", () => {
  it("stores the text exactly as typed, imposing no template", () => {
    const s = reducer(initialState(TODAY), {
      type: "setLine",
      line: "untuk urusan pinjaman Maybank sahaja",
    });
    expect(s.line).toBe("untuk urusan pinjaman Maybank sahaja");
  });

  it("does not append a date — the user decides whether to include one", () => {
    const s = reducer(initialState(TODAY), { type: "setLine", line: "UNTUK BANK SAHAJA" });
    expect(s.line).toBe("UNTUK BANK SAHAJA");
    expect(s.line).not.toContain("2026");
  });
});

describe("setStyle", () => {
  it("applies one angle to both faces", () => {
    const s = reducer(initialState(TODAY), { type: "setStyle", patch: { angleDeg: -30 } });
    expect(s.style.angleDeg).toBe(-30);
    expect(s.placements.front).toEqual(defaultPlacement("front"));
  });

  it("clamps angle, font size and length to their ranges", () => {
    const s = reducer(initialState(TODAY), {
      type: "setStyle",
      patch: { angleDeg: 999, fontSize: 999, lengthFactor: 999 },
    });
    expect(s.style).toEqual({
      angleDeg: 45,
      fontSize: 24,
      lengthFactor: 1.2,
      ink: "#000000",
      opacity: 1,
    });
  });
});

describe("placements", () => {
  it("clamps a dragged centre to its own card", () => {
    const s = reducer(initialState(TODAY), {
      type: "setPlacement",
      slot: "front",
      patch: { cx: -999, cy: -999 },
    });
    const rect = cardRect("front");
    expect(s.placements.front).toEqual({ cx: rect.x, cy: rect.y });
  });

  it("moves one face without moving the other", () => {
    const s = reducer(initialState(TODAY), {
      type: "setPlacement",
      slot: "back",
      patch: { cx: 300 },
    });
    expect(s.placements.back.cx).toBe(300);
    expect(s.placements.front).toEqual(defaultPlacement("front"));
  });

  it("resets only the requested face", () => {
    let s = reducer(initialState(TODAY), { type: "setPlacement", slot: "front", patch: { cx: 300 } });
    s = reducer(s, { type: "setPlacement", slot: "back", patch: { cx: 300 } });
    s = reducer(s, { type: "resetPlacement", slot: "front" });
    expect(s.placements.front).toEqual(defaultPlacement("front"));
    expect(s.placements.back.cx).toBe(300);
  });
});

describe("scans", () => {
  it("adds and removes one face without touching the other", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setScan", slot: "back", scan: fakeScan() });
    s = reducer(s, { type: "removeScan", slot: "back" });
    expect(s.scans.front).toBeDefined();
    expect(s.scans.back).toBeUndefined();
  });

  it("keeps a face's placement when its scan is replaced", () => {
    let s = reducer(initialState(TODAY), { type: "setPlacement", slot: "front", patch: { cx: 300 } });
    s = reducer(s, { type: "setScan", slot: "front", scan: fakeScan() });
    expect(s.placements.front.cx).toBe(300);
  });
});

describe("crops", () => {
  const crop = { rotation: 90 as const, area: { x: 0, y: 100, width: 1600, height: 1010 } };

  it("frames one face without touching the other", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setScan", slot: "back", scan: fakeScan() });
    s = reducer(s, { type: "setCrop", slot: "front", crop });
    expect(s.scans.front?.crop).toEqual(crop);
    expect(s.scans.back?.crop).toBeUndefined();
  });

  it("drops the crop when a new image is uploaded for that face", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setCrop", slot: "front", crop });
    s = reducer(s, { type: "setScan", slot: "front", scan: fakeScan(3000, 4000) });
    expect(s.scans.front?.crop).toBeUndefined();
  });

  it("ignores a crop for a face with no image", () => {
    const s = reducer(initialState(TODAY), { type: "setCrop", slot: "back", crop });
    expect(s.scans.back).toBeUndefined();
  });

  it("leaves a card's band where it was when the card is cropped", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setPlacement", slot: "front", patch: { cx: 300 } });
    s = reducer(s, { type: "setCrop", slot: "front", crop });
    expect(s.placements.front.cx).toBe(300);
  });

  it("resets a face's crop without touching the image", () => {
    const scan = fakeScan();
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan });
    s = reducer(s, { type: "setCrop", slot: "front", crop });
    s = reducer(s, { type: "resetCrop", slot: "front" });
    expect(s.scans.front).toEqual(scan);
  });
});

describe("Page crops", () => {
  // A tall Page is fitted 561.5px wide, from x 116.25; cropped, it fills the
  // 794 x 1123 sheet.
  const tall = () => fakeScan(1000, 2000);
  const pageCrop = initialCrop(1000, 2000, "page");
  const onPage = (...actions: Parameters<typeof reducer>[1][]) =>
    actions.reduce(
      reducer,
      reducer(reducer(initialState(TODAY), { type: "setKind", kind: "page" }), {
        type: "setStyle",
        patch: { angleDeg: 0 },
      }),
    );

  it("stores the Crop beside the Page Scan", () => {
    const s = onPage(
      { type: "setScan", slot: "page", scan: tall() },
      { type: "setCrop", slot: "page", crop: pageCrop },
    );
    expect(s.scans.page?.crop).toEqual(pageCrop);
    expect(s.scans.page?.width).toBe(1000);
  });

  it("starts the band afresh near the cropped Page's top-left corner", () => {
    const s = onPage(
      { type: "setScan", slot: "page", scan: tall() },
      { type: "setPlacement", slot: "page", patch: { cx: 400, cy: 600 } },
      { type: "setCrop", slot: "page", crop: pageCrop },
    );
    // Where it starts on an uncropped Page that already fills the sheet.
    const a4 = onPage({ type: "setScan", slot: "page", scan: fakeScan(794, 1123) });
    expect(s.placements.page).toEqual(a4.placements.page);
    expect(s.placements.page.cy).toBeCloseTo(0.1 * 1123, 6);
  });

  it("restores the uncropped Page on reset, its band back on the whole Page", () => {
    const s = onPage(
      { type: "setScan", slot: "page", scan: tall() },
      { type: "setCrop", slot: "page", crop: pageCrop },
      { type: "resetCrop", slot: "page" },
    );
    expect(s.scans.page?.crop).toBeUndefined();
    expect(s.placements.page.cx).toBeCloseTo(116.25 + 0.16 * 561.5, 6);
  });

  it("clears the Crop when a new Page Scan arrives", () => {
    const s = onPage(
      { type: "setScan", slot: "page", scan: tall() },
      { type: "setCrop", slot: "page", crop: pageCrop },
      { type: "setScan", slot: "page", scan: tall() },
    );
    expect(s.scans.page?.crop).toBeUndefined();
  });
});

describe("setDate", () => {
  it("updates the date used for the filename", () => {
    const s = reducer(initialState("2026-09-30"), { type: "setDate", date: "2026-10-01" });
    expect(s.date).toBe("2026-10-01");
  });

  it("leaves the palang text alone, since the date is no longer part of it", () => {
    let s = reducer(initialState("2026-09-30"), { type: "setLine", line: "MY WORDING" });
    s = reducer(s, { type: "setDate", date: "2026-10-01" });
    expect(s.line).toBe("MY WORDING");
  });
});

describe("canExport", () => {
  it("is false with no scan", () => {
    const s = reducer(initialState(TODAY), { type: "setLine", line: "UNTUK BANK SAHAJA" });
    expect(canExport(s)).toBe(false);
  });

  it("is false with a scan once the text has been cleared", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setLine", line: "" });
    expect(canExport(s)).toBe(false);
  });

  it("is false when the text is only whitespace", () => {
    // Two red lines with no sentence between them looks marked while granting
    // no limit on use, which is worse than no palang at all.
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setLine", line: "    " });
    expect(canExport(s)).toBe(false);
  });

  it("is true with one scan and some text", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setLine", line: "UNTUK BANK SAHAJA" });
    expect(canExport(s)).toBe(true);
  });
});

describe("clearAll", () => {
  it("returns to the initial state", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setLine", line: "X" });
    s = reducer(s, { type: "clearAll", today: TODAY });
    expect(s).toEqual(initialState(TODAY));
  });
});

describe("persistence invariant", () => {
  it("writes nothing to localStorage when scans and text are set", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setScan", slot: "back", scan: fakeScan() });
    s = reducer(s, { type: "setLine", line: "UNTUK BANK SAHAJA" });

    const keys = Object.keys(localStorage);
    expect(keys.filter((k) => k !== SAVED_LINES_KEY)).toEqual([]);
    for (const key of keys) {
      const value = localStorage.getItem(key) ?? "";
      expect(value).not.toContain("data:image");
      expect(value).not.toContain("base64");
    }
  });
});

describe("document kind", () => {
  it("starts as a MyKad", () => {
    expect(initialState(TODAY).kind).toBe("mykad");
  });

  it("switches to a Page and back, keeping the text and Band style", () => {
    let s = reducer(initialState(TODAY), { type: "setLine", line: "UNTUK SEKOLAH SAHAJA" });
    s = reducer(s, { type: "setStyle", patch: { angleDeg: -20, ink: "#c00000" } });
    s = reducer(s, { type: "setKind", kind: "page" });
    expect(s.kind).toBe("page");
    expect(s.line).toBe("UNTUK SEKOLAH SAHAJA");
    expect(s.style).toMatchObject({ angleDeg: -20, ink: "#c00000" });
    s = reducer(s, { type: "setKind", kind: "mykad" });
    expect(s.kind).toBe("mykad");
    expect(s.style).toMatchObject({ angleDeg: -20, ink: "#c00000" });
  });

  it("keeps each kind's scans and placements across a round trip", () => {
    const front = fakeScan();
    const page = fakeScan(2480, 3508);
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: front });
    s = reducer(s, { type: "setPlacement", slot: "front", patch: { cx: 300, cy: 200 } });
    s = reducer(s, { type: "setKind", kind: "page" });
    s = reducer(s, { type: "setScan", slot: "page", scan: page });
    s = reducer(s, { type: "setPlacement", slot: "page", patch: { cx: 400, cy: 500 } });
    s = reducer(s, { type: "setKind", kind: "mykad" });
    expect(s.scans.front).toBe(front);
    expect(s.placements.front).toEqual({ cx: 300, cy: 200 });
    s = reducer(s, { type: "setKind", kind: "page" });
    expect(s.scans.page).toBe(page);
    expect(s.placements.page).toEqual({ cx: 400, cy: 500 });
  });

  it("is emptied of both kinds' scans by Clear all, back to a MyKad", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setKind", kind: "page" });
    s = reducer(s, { type: "setScan", slot: "page", scan: fakeScan(2480, 3508) });
    s = reducer(s, { type: "clearAll", today: TODAY });
    expect(s.scans).toEqual({});
    expect(s.kind).toBe("mykad");
  });
});

describe("Page placement", () => {
  // A tall Page is fitted 561.5px wide, from x 116.25, the full sheet height.
  const tall = () => fakeScan(1000, 2000);
  const onPage = (...actions: Parameters<typeof reducer>[1][]) =>
    actions.reduce(reducer, reducer(initialState(TODAY), { type: "setKind", kind: "page" }));

  it("starts a new Page scan near the Page's top-left corner, with no crop", () => {
    const s = onPage(
      { type: "setStyle", patch: { angleDeg: 0 } },
      { type: "setScan", slot: "page", scan: tall() },
    );
    expect(s.placements.page.cx).toBeCloseTo(116.25 + 0.16 * 561.5, 6);
    expect(s.placements.page.cy).toBeCloseTo(0.1 * 1123, 6);
    expect(s.scans.page?.crop).toBeUndefined();
  });

  it("starts a new Page scan at the default even after the last one was moved", () => {
    const s = onPage(
      { type: "setStyle", patch: { angleDeg: 0 } },
      { type: "setScan", slot: "page", scan: tall() },
      { type: "setPlacement", slot: "page", patch: { cx: 400, cy: 600 } },
      { type: "setScan", slot: "page", scan: tall() },
    );
    expect(s.placements.page.cx).toBeCloseTo(206.09, 6);
  });

  it("stores the default exactly where the band is drawn, pulled onto the sheet", () => {
    const s = onPage({ type: "setScan", slot: "page", scan: tall() });
    const { band } = layoutSlot(copyLayout(s), "page");
    expect(s.placements.page).toEqual({ cx: band.cx, cy: band.cy });
  });

  it("resets to the default for the current Page", () => {
    const s = onPage(
      { type: "setStyle", patch: { angleDeg: 0 } },
      { type: "setScan", slot: "page", scan: tall() },
      { type: "setPlacement", slot: "page", patch: { cx: 400, cy: 600 } },
      { type: "resetPlacement", slot: "page" },
    );
    expect(s.placements.page.cx).toBeCloseTo(206.09, 6);
    expect(s.placements.page.cy).toBeCloseTo(112.3, 6);
  });

  it("stops a dragged band at the sheet edge, as drawn", () => {
    const s = onPage(
      { type: "setScan", slot: "page", scan: tall() },
      { type: "setPlacement", slot: "page", patch: { cx: 9999, cy: -9999 } },
    );
    const { band } = layoutSlot(copyLayout(s), "page");
    expect(s.placements.page).toEqual({ cx: band.cx, cy: band.cy });
    expect(band.cx).toBeLessThan(794);
    expect(band.cy).toBeGreaterThan(0);
  });

  it("follows the band when a longer Band style pushes it back on the sheet", () => {
    const s = onPage(
      { type: "setStyle", patch: { angleDeg: 0 } },
      { type: "setScan", slot: "page", scan: tall() },
      { type: "setPlacement", slot: "page", patch: { cx: 9999 } },
      { type: "setStyle", patch: { lengthFactor: 1.2 } },
    );
    const { band } = layoutSlot(copyLayout(s), "page");
    expect(s.placements.page).toEqual({ cx: band.cx, cy: band.cy });
  });

  it("leaves the MyKad placements alone", () => {
    const s = onPage({ type: "setScan", slot: "page", scan: tall() });
    expect(s.placements.front).toEqual(defaultPlacement("front"));
    expect(s.placements.back).toEqual(defaultPlacement("back"));
  });
});

describe("canExport by kind", () => {
  it("ignores a MyKad scan while the Page is active", () => {
    let s = reducer(initialState(TODAY), { type: "setScan", slot: "front", scan: fakeScan() });
    s = reducer(s, { type: "setKind", kind: "page" });
    expect(canExport(s)).toBe(false);
  });

  it("ignores a Page scan while the MyKad is active", () => {
    let s = reducer(initialState(TODAY), { type: "setKind", kind: "page" });
    s = reducer(s, { type: "setScan", slot: "page", scan: fakeScan(2480, 3508) });
    expect(canExport(s)).toBe(true);
    s = reducer(s, { type: "setKind", kind: "mykad" });
    expect(canExport(s)).toBe(false);
  });

  it("still needs text on a Page", () => {
    let s = reducer(initialState(TODAY), { type: "setKind", kind: "page" });
    s = reducer(s, { type: "setScan", slot: "page", scan: fakeScan(2480, 3508) });
    s = reducer(s, { type: "setLine", line: "  " });
    expect(canExport(s)).toBe(false);
  });
});
