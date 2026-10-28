import { describe, expect, it } from "vitest";
import { copyLayout, layoutSlot } from "@/domain/copyLayout";
import { initialState, type Scan } from "@/state/session";

const TODAY = "2026-10-01";
const fakeScan = (width = 856, height = 540): Scan =>
  ({ width, height, bitmap: {} as ImageBitmap });

describe("copyLayout for a MyKad", () => {
  it("is a portrait A4 sheet", () => {
    expect(copyLayout(initialState(TODAY)).sheet).toEqual({ width: 794, height: 1123 });
  });

  it("puts the front and back card slots where they have always been", () => {
    const layout = copyLayout(initialState(TODAY));
    expect(layout.slots.map((s) => s.id)).toEqual(["front", "back"]);
    expect(layoutSlot(layout, "front").slot).toEqual({ x: 235, y: 94, width: 323, height: 204 });
    expect(layoutSlot(layout, "back").slot).toEqual({ x: 235, y: 355, width: 323, height: 204 });
  });
});

describe("copyLayout band geometry", () => {
  it("places each face's band at its tuned default with today's proportions", () => {
    const layout = copyLayout(initialState(TODAY));
    const front = layoutSlot(layout, "front").band;
    expect(front).toMatchObject({ cx: 269, cy: 134, fontSize: 13 });
    expect(front.length).toBeCloseTo(177.65, 6);
    expect(front.lineGap).toBeCloseTo(20.8, 6);
    expect(front.strokeWidth).toBeCloseTo(1.56, 6);
    expect(layoutSlot(layout, "back").band).toMatchObject({ cx: 269, cy: 395 });
  });

  it("follows the Band style's size and length", () => {
    const s = initialState(TODAY);
    const band = layoutSlot(
      copyLayout({ ...s, style: { ...s.style, fontSize: 20, lengthFactor: 1 } }),
      "front",
    ).band;
    expect(band.fontSize).toBe(20);
    expect(band.length).toBe(323);
    expect(band.lineGap).toBeCloseTo(32, 6);
    expect(band.strokeWidth).toBeCloseTo(2.4, 6);
  });

  it("bounds each band's centre by exactly its own card", () => {
    const layout = copyLayout(initialState(TODAY));
    expect(layoutSlot(layout, "front").band.bounds).toEqual({
      minX: 235,
      maxX: 558,
      minY: 94,
      maxY: 298,
    });
    expect(layoutSlot(layout, "back").band.bounds).toEqual({
      minX: 235,
      maxX: 558,
      minY: 355,
      maxY: 559,
    });
  });

  it("lets the default band's ends overhang the card's top-left corner", () => {
    const front = layoutSlot(copyLayout(initialState(TODAY)), "front");
    const reach = front.band.length / (2 * Math.SQRT2);
    expect(front.band.cx - reach).toBeLessThan(front.slot.x);
    expect(front.band.cy - reach).toBeLessThan(front.slot.y);
  });

  it("clamps a centre placed off its card back onto the card", () => {
    const s = initialState(TODAY);
    const placed = { ...s, placements: { ...s.placements, front: { cx: -999, cy: 9999 } } };
    expect(layoutSlot(copyLayout(placed), "front").band).toMatchObject({ cx: 235, cy: 298 });
  });
});

describe("copyLayout document boxes", () => {
  it("leaves an empty slot without an image, boxed by the slot itself", () => {
    const front = layoutSlot(copyLayout(initialState(TODAY)), "front");
    expect(front.image).toBeNull();
    expect(front.box).toEqual(front.slot);
  });

  it("contain-fits an uncropped scan inside its card slot, letterboxed and centred", () => {
    const s = { ...initialState(TODAY), scans: { front: fakeScan(1000, 1000) } };
    const front = layoutSlot(copyLayout(s), "front");
    expect(front.box).toEqual({ x: 294.5, y: 94, width: 204, height: 204 });
    expect(front.image).toEqual({
      x: 294.5,
      y: 94,
      width: 204,
      height: 204,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    });
  });

  it("fills the card slot exactly with a cropped scan", () => {
    const area = { x: 10, y: 20, width: 500, height: 315 };
    const scan = { ...fakeScan(), crop: { rotation: 0 as const, area, orientation: "landscape" as const } };
    const s = { ...initialState(TODAY), scans: { back: scan } };
    const back = layoutSlot(copyLayout(s), "back");
    expect(back.box).toEqual({ x: 235, y: 355, width: 323, height: 204 });
    expect(back.image).toEqual({
      crop: area,
      x: 396.5,
      y: 457,
      width: 323,
      height: 204,
      offsetX: 161.5,
      offsetY: 102,
      rotation: 0,
    });
  });

  it("turns a quarter-turned crop back into the original image's pixels", () => {
    const area = { x: 0, y: 0, width: 540, height: 340 };
    const scan = { ...fakeScan(540, 856), crop: { rotation: 90 as const, area, orientation: "landscape" as const } };
    const s = { ...initialState(TODAY), scans: { front: scan } };
    const front = layoutSlot(copyLayout(s), "front");
    expect(front.box).toEqual(front.slot);
    expect(front.image).toMatchObject({
      crop: { x: 0, y: 316, width: 340, height: 540 },
      width: 204,
      height: 323,
      rotation: 90,
    });
  });

  it("draws a slot's band whether or not it has a Scan yet", () => {
    expect(layoutSlot(copyLayout(initialState(TODAY)), "back").band.cy).toBe(395);
  });

  it("rounds a MyKad's corners by the session's corner radius", () => {
    const s = { ...initialState(TODAY), cornerRadius: 7 };
    expect(copyLayout(s).slots.map((slot) => slot.cornerRadius)).toEqual([7, 7]);
  });
});
