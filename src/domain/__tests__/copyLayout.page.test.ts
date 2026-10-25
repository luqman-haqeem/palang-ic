import { describe, expect, it } from "vitest";
import { type BandLayout, copyLayout, layoutSlot } from "@/domain/copyLayout";
import type { BandStyle } from "@/domain/palang";
import { initialState, type Scan, type SessionState } from "@/state/session";

const TODAY = "2026-10-01";
const fakeScan = (width: number, height: number): Scan =>
  ({ width, height, bitmap: {} as ImageBitmap });

function pageSession(
  scan?: Scan,
  opts: { style?: Partial<BandStyle>; at?: { cx: number; cy: number } } = {},
): SessionState {
  const s = initialState(TODAY);
  return {
    ...s,
    kind: "page",
    scans: scan ? { page: scan } : {},
    style: { ...s.style, ...opts.style },
    placements: { ...s.placements, page: opts.at ?? s.placements.page },
  };
}

const page = (s: SessionState) => layoutSlot(copyLayout(s), "page");

/** The four corners of the band's outer edges, rotated about its centre: the
 *  area both lines' strokes and the text between them can reach. */
function bandCorners(band: BandLayout, angleDeg: number) {
  const t = (angleDeg * Math.PI) / 180;
  const halfLength = band.length / 2;
  const halfThick = band.lineGap / 2 + band.strokeWidth / 2;
  return [
    [-halfLength, -halfThick],
    [halfLength, -halfThick],
    [halfLength, halfThick],
    [-halfLength, halfThick],
  ].map(([x, y]) => ({
    x: band.cx + x * Math.cos(t) - y * Math.sin(t),
    y: band.cy + x * Math.sin(t) + y * Math.cos(t),
  }));
}

function expectInsideSheet(s: SessionState) {
  const layout = copyLayout(s);
  const { band } = layoutSlot(layout, "page");
  for (const corner of bandCorners(band, s.style.angleDeg)) {
    expect(corner.x).toBeGreaterThanOrEqual(-1e-9);
    expect(corner.y).toBeGreaterThanOrEqual(-1e-9);
    expect(corner.x).toBeLessThanOrEqual(layout.sheet.width + 1e-9);
    expect(corner.y).toBeLessThanOrEqual(layout.sheet.height + 1e-9);
  }
}

describe("copyLayout for a Page", () => {
  it("draws only the Page, not the card slots", () => {
    expect(copyLayout(pageSession()).slots.map((s) => s.id)).toEqual(["page"]);
  });

  it("is a portrait A4 sheet with no Scan yet", () => {
    expect(copyLayout(pageSession()).sheet).toEqual({ width: 794, height: 1123 });
  });

  it("fills the sheet's height with a tall Page, with no margin", () => {
    const { box } = page(pageSession(fakeScan(1000, 2000)));
    expect(box).toEqual({ x: 116.25, y: 0, width: 561.5, height: 1123 });
  });

  it("fills the sheet's width with a squarer portrait Page, never cropping it", () => {
    const { box } = page(pageSession(fakeScan(1000, 1200)));
    expect(box.x).toBe(0);
    expect(box.width).toBe(794);
    expect(box.height).toBeCloseTo(952.8, 6);
    expect(box.y).toBeCloseTo(85.1, 6);
  });

  it("turns the sheet landscape for a landscape Page, filled edge to edge", () => {
    const layout = copyLayout(pageSession(fakeScan(3508, 2480)));
    expect(layout.sheet).toEqual({ width: 1123, height: 794 });
    const { box } = layoutSlot(layout, "page");
    expect(box.x).toBe(0);
    expect(box.width).toBe(1123);
    expect(box.height).toBeCloseTo(793.9, 1);
  });

  it("keeps the sheet portrait for a square Page", () => {
    expect(copyLayout(pageSession(fakeScan(1000, 1000))).sheet).toEqual({
      width: 794,
      height: 1123,
    });
  });

  it("has square corners whatever the card corner radius", () => {
    const s = { ...pageSession(fakeScan(1000, 1200)), cornerRadius: 12 };
    expect(page(s).cornerRadius).toBe(0);
  });

  it("draws the Scan into its fitted box", () => {
    expect(page(pageSession(fakeScan(1000, 2000))).image).toEqual({
      x: 116.25,
      y: 0,
      width: 561.5,
      height: 1123,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    });
  });
});

describe("copyLayout band on a Page", () => {
  it("scales the band by document width over card width", () => {
    // A 794px-wide Page against the 323px card.
    const band = page(pageSession(fakeScan(1000, 1200), { style: { angleDeg: 0 } })).band;
    expect(band.fontSize).toBeCloseTo((13 * 794) / 323, 6);
    expect(band.lineGap).toBeCloseTo((1.6 * 13 * 794) / 323, 6);
    expect(band.strokeWidth).toBeCloseTo((0.12 * 13 * 794) / 323, 6);
    expect(band.length).toBeCloseTo(0.55 * 794, 6);
  });

  it("draws a narrower Page's band smaller", () => {
    const band = page(pageSession(fakeScan(1000, 2000), { style: { angleDeg: 0 } })).band;
    expect(band.fontSize).toBeCloseTo((13 * 561.5) / 323, 6);
    expect(band.length).toBeCloseTo(0.55 * 561.5, 6);
  });

  it("shortens a band too long for the sheet at 0° to the sheet's width", () => {
    const s = pageSession(fakeScan(1000, 1200), { style: { angleDeg: 0, lengthFactor: 1.2 } });
    expect(page(s).band.length).toBeCloseTo(794, 6);
    expectInsideSheet(s);
  });

  it("shortens a band too long for a landscape sheet at 45°", () => {
    const s = pageSession(fakeScan(3508, 2480), { style: { angleDeg: 45, lengthFactor: 1.2 } });
    expect(page(s).band.length).toBeLessThan(1.2 * 1123);
    expectInsideSheet(s);
  });

  it("keeps a band of normal length as it is", () => {
    const s = pageSession(fakeScan(1000, 1200), { style: { angleDeg: -45 } });
    expect(page(s).band.length).toBeCloseTo(0.55 * 794, 6);
  });

  it("clamps a centre dragged off the top-left back onto the Page", () => {
    const s = pageSession(fakeScan(1000, 1200), {
      style: { angleDeg: 0 },
      at: { cx: -999, cy: -999 },
    });
    const band = page(s).band;
    // Half the band's length in from the sheet's left edge, and on the
    // document's top edge, which is lower than the sheet allows.
    expect(band.cx).toBeCloseTo((0.55 * 794) / 2, 6);
    expect(band.cy).toBeCloseTo(85.1, 6);
  });

  it("clamps a centre dragged off the bottom-right back onto the sheet", () => {
    const s = pageSession(fakeScan(1000, 1200), {
      style: { angleDeg: 0 },
      at: { cx: 9999, cy: 9999 },
    });
    const band = page(s).band;
    expect(band.cx).toBeCloseTo(794 - (0.55 * 794) / 2, 6);
    expect(band.cy).toBeCloseTo(85.1 + 952.8, 6);
  });

  it("keeps a centre already inside where it is", () => {
    const s = pageSession(fakeScan(1000, 1200), { at: { cx: 400, cy: 500 } });
    expect(page(s).band).toMatchObject({ cx: 400, cy: 500 });
  });

  for (const angleDeg of [0, 45, -45, -30]) {
    for (const [scan, name] of [
      [fakeScan(1000, 2000), "tall"],
      [fakeScan(3508, 2480), "landscape"],
    ] as const) {
      for (const at of [
        { cx: -999, cy: -999 },
        { cx: 9999, cy: -999 },
        { cx: -999, cy: 9999 },
        { cx: 9999, cy: 9999 },
      ]) {
        it(`keeps the whole band on a ${name} sheet at ${angleDeg}° pushed to (${at.cx}, ${at.cy})`, () => {
          expectInsideSheet(
            pageSession(scan, { style: { angleDeg, lengthFactor: 1.2, fontSize: 24 }, at }),
          );
        });
      }
    }
  }

  it("bounds the centre by the same range it clamps to", () => {
    const s = pageSession(fakeScan(1000, 1200), { style: { angleDeg: 0 } });
    const { bounds } = page(s).band;
    expect(bounds.minX).toBeCloseTo((0.55 * 794) / 2, 6);
    expect(bounds.maxX).toBeCloseTo(794 - (0.55 * 794) / 2, 6);
    expect(bounds.minY).toBeCloseTo(85.1, 6);
    expect(bounds.maxY).toBeCloseTo(1037.9, 6);
  });
});
