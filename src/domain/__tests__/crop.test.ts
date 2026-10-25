import { describe, expect, it } from "vitest";
import {
  cardImageGeometry,
  clampCropArea,
  cropBox,
  defaultCropArea,
  initialCrop,
  needsCrop,
  rotateCrop,
  rotatedSize,
  zoomCropArea,
} from "@/domain/crop";

describe("needsCrop", () => {
  it("opens the editor for a portrait phone photo", () => {
    expect(needsCrop(3000, 4000)).toBe(true);
  });

  it("leaves a scan already cropped tight to the card alone", () => {
    expect(needsCrop(1011, 638)).toBe(false);
  });

  it("opens the editor for a landscape photo with lots of background", () => {
    expect(needsCrop(4000, 3000)).toBe(true); // 1.33
  });

  it("tolerates a loosely cropped scan within 10% of the card shape", () => {
    expect(needsCrop(1450, 1000)).toBe(false);
    expect(needsCrop(1720, 1000)).toBe(false);
  });

  it("opens the editor just past 10% either side", () => {
    expect(needsCrop(1410, 1000)).toBe(true);
    expect(needsCrop(1760, 1000)).toBe(true);
  });
});

describe("defaultCropArea", () => {
  it("frames the widest card-shaped area across the middle of a portrait photo", () => {
    const area = defaultCropArea(3000, 4000);
    expect(area.x).toBe(0);
    expect(area.width).toBe(3000);
    expect(area.height).toBeCloseTo(1894.74, 2); // 3000 / (323/204)
    expect(area.y).toBeCloseTo(1052.63, 2); // centred vertically
  });

  it("frames the full height of a photo wider than a card", () => {
    const area = defaultCropArea(4000, 1000);
    expect(area.y).toBe(0);
    expect(area.height).toBe(1000);
    expect(area.width).toBeCloseTo(1583.33, 2); // 1000 * (323/204)
    expect(area.x).toBeCloseTo(1208.33, 2);
  });
});

describe("clampCropArea", () => {
  const RATIO = 323 / 204;
  const area = (x: number, y: number, width: number) => ({ x, y, width, height: width / RATIO });

  it("stops zooming out once the photo fills the frame", () => {
    const a = clampCropArea(area(-500, 0, 5000), 3000, 4000);
    expect(a.width).toBe(3000);
  });

  it("stops zooming in where the crop would print below 300dpi", () => {
    const a = clampCropArea(area(1000, 1000, 400), 3000, 4000);
    expect(a.width).toBeCloseTo(1009.375, 3); // 323px card box x 300/96
  });

  it("lets a photo too small for 300dpi fill the frame but not zoom in", () => {
    const a = clampCropArea(area(100, 100, 300), 800, 1000);
    expect(a.width).toBe(800);
  });

  it("keeps the card shape whatever it is asked to do", () => {
    const a = clampCropArea({ x: 0, y: 0, width: 2000, height: 300 }, 3000, 4000);
    expect(a.width / a.height).toBeCloseTo(RATIO, 6);
  });

  it("stops a pan at the edge of the photo, so the frame is never left uncovered", () => {
    expect(clampCropArea(area(-200, -50, 2000), 3000, 4000)).toMatchObject({ x: 0, y: 0 });
    const far = clampCropArea(area(2500, 3900, 2000), 3000, 4000);
    expect(far.x).toBe(1000);
    expect(far.y + far.height).toBeCloseTo(4000, 6);
  });
});

describe("zoomCropArea", () => {
  const start = { x: 0, y: 1000, width: 3000, height: 3000 * (204 / 323) };

  it("keeps the point under the fingers still while zooming in", () => {
    const a = zoomCropArea(start, 2, { x: 0, y: 1000 }, 3000, 4000);
    expect(a).toMatchObject({ x: 0, y: 1000, width: 1500 });
  });

  it("zooms about the middle of the frame for the + button", () => {
    const mid = { x: 1500, y: 1000 + start.height / 2 };
    const a = zoomCropArea(start, 2, mid, 3000, 4000);
    expect(a.x).toBeCloseTo(750, 6);
    expect(a.y + a.height / 2).toBeCloseTo(mid.y, 6);
  });

  it("still respects the 300dpi zoom limit", () => {
    const a = zoomCropArea(start, 10, { x: 1500, y: 2000 }, 3000, 4000);
    expect(a.width).toBeCloseTo(1009.375, 3);
  });
});

describe("rotatedSize", () => {
  it("swaps the sides for a quarter turn and keeps them for a half turn", () => {
    expect(rotatedSize(3000, 4000, 90)).toEqual({ width: 4000, height: 3000 });
    expect(rotatedSize(3000, 4000, 270)).toEqual({ width: 4000, height: 3000 });
    expect(rotatedSize(3000, 4000, 180)).toEqual({ width: 3000, height: 4000 });
  });
});

describe("rotateCrop", () => {
  it("turns a sideways card upright and reframes the whole of the turned photo", () => {
    const turned = rotateCrop(initialCrop(3000, 4000), 90, 3000, 4000);
    expect(turned.rotation).toBe(90);
    expect(turned.area).toEqual(defaultCropArea(4000, 3000));
  });

  it("turns anticlockwise from upright to 270", () => {
    expect(rotateCrop(initialCrop(3000, 4000), -90, 3000, 4000).rotation).toBe(270);
  });

  it("comes back upright after four quarter turns", () => {
    let crop = initialCrop(3000, 4000);
    for (let i = 0; i < 4; i++) crop = rotateCrop(crop, 90, 3000, 4000);
    expect(crop).toEqual(initialCrop(3000, 4000));
  });
});

describe("cardImageGeometry", () => {
  // A 3000x4000 photo; the area is in the turned photo's pixels.
  const area = { x: 100, y: 200, width: 1600, height: 1000 };
  const card = { x: 10, y: 20, width: 323, height: 204 };

  it("cuts the area straight out of an upright photo and fills the card", () => {
    const g = cardImageGeometry({ rotation: 0, area }, 3000, 4000, card);
    expect(g.crop).toEqual(area);
    expect(g.rotation).toBe(0);
    expect({ x: g.x - g.offsetX, y: g.y - g.offsetY, width: g.width, height: g.height }).toEqual(
      card,
    );
  });

  it("cuts from the bottom-left of the original for a clockwise quarter turn", () => {
    const g = cardImageGeometry({ rotation: 90, area }, 3000, 4000, card);
    expect(g.crop).toEqual({ x: 200, y: 2300, width: 1000, height: 1600 });
  });

  it("cuts from the opposite corner for a half turn", () => {
    const g = cardImageGeometry({ rotation: 180, area }, 3000, 4000, card);
    expect(g.crop).toEqual({ x: 1300, y: 2800, width: 1600, height: 1000 });
  });

  it("cuts from the top-right of the original for an anticlockwise quarter turn", () => {
    const g = cardImageGeometry({ rotation: 270, area }, 3000, 4000, card);
    expect(g.crop).toEqual({ x: 1800, y: 100, width: 1000, height: 1600 });
  });

  it("draws a quarter-turned image upright, centred on the card box", () => {
    const g = cardImageGeometry({ rotation: 90, area }, 3000, 4000, card);
    expect(g).toMatchObject({
      rotation: 90,
      width: 204, // drawn sideways, then turned to fill 323 x 204
      height: 323,
      offsetX: 102,
      offsetY: 161.5,
      x: 171.5, // card centre
      y: 122,
    });
  });
});

describe("a Page Crop", () => {
  it("frames the tallest portrait A4 area across the middle of a portrait photo", () => {
    const area = defaultCropArea(3000, 4000, "page");
    expect(area.y).toBe(0);
    expect(area.height).toBe(4000);
    expect(area.width).toBeCloseTo(2828.1, 1); // 4000 / (1123/794), about 4000 / √2
    expect(area.x).toBeCloseTo(85.9, 1);
  });

  it("starts upright on a portrait A4 area", () => {
    const crop = initialCrop(3000, 4000, "page");
    expect(crop.rotation).toBe(0);
    expect(crop.area.width / crop.area.height).toBeCloseTo(1 / Math.SQRT2, 3);
  });

  it("turns landscape after a quarter turn, and portrait again after another", () => {
    const turned = rotateCrop(initialCrop(3000, 4000, "page"), 90, 3000, 4000, "page");
    expect(turned.area).toMatchObject({ x: 0, width: 4000 });
    expect(turned.area.width / turned.area.height).toBeCloseTo(Math.SQRT2, 3);
    const back = rotateCrop(turned, 90, 3000, 4000, "page");
    expect(back.area.width / back.area.height).toBeCloseTo(1 / Math.SQRT2, 3);
  });

  it("keeps A4 proportions whatever it is asked to do", () => {
    const a = clampCropArea({ x: 0, y: 0, width: 2000, height: 300 }, 3000, 4000, "page");
    expect(a.width / a.height).toBeCloseTo(1 / Math.SQRT2, 3);
  });

  it("zooms in on a phone photo as far as a 150dpi Page", () => {
    const start = defaultCropArea(3000, 4000, "page");
    const a = zoomCropArea(start, 10, { x: 1500, y: 2000 }, 3000, 4000, "page");
    expect(a.width).toBeCloseTo(1240.6, 1); // 794px sheet x 150/96
    expect(a.width / a.height).toBeCloseTo(1 / Math.SQRT2, 3);
  });

  it("leaves a MyKad Crop card-shaped", () => {
    expect(defaultCropArea(3000, 4000)).toEqual(defaultCropArea(3000, 4000, "card"));
  });
});

describe("cropBox", () => {
  it("is the card box for a Card face, however the photo is turned", () => {
    expect(cropBox("card", 3000, 4000)).toEqual({ width: 323, height: 204 });
  });

  it("is the A4 sheet for a Page, turned to the photo", () => {
    expect(cropBox("page", 3000, 4000)).toEqual({ width: 794, height: 1123 });
    expect(cropBox("page", 4000, 3000)).toEqual({ width: 1123, height: 794 });
  });
});
