import { PAGE } from "@/domain/page";

/** 300dpi over the 96dpi logical page. */
export const BASE_PIXEL_RATIO = 300 / 96;

const PORTRAIT_SHEET = { width: PAGE.widthPx, height: PAGE.heightPx };

/** Konva sizes the export canvas from `stage.width()`, and the preview stage is
 *  sized `sheet.width * scale` so it fits the viewport. Dividing the ratio by
 *  that scale makes the exported Copy 300dpi regardless of window width —
 *  without it a phone-width preview exports at roughly 124dpi and the IC number
 *  the palang exists to keep legible may not survive the print. The ratio holds
 *  for either orientation, since the scale already comes from the sheet's own
 *  width. */
export function exportPixelRatio(stageScale: number): number {
  const scale = stageScale > 0 ? stageScale : 1;
  return BASE_PIXEL_RATIO / scale;
}

/** The exported Copy's size for a sheet in logical px: portrait A4 by default,
 *  or the landscape sheet a landscape Page lays out on. */
export function exportedPixelSize(
  stageScale: number,
  sheet: { width: number; height: number } = PORTRAIT_SHEET,
): { width: number; height: number } {
  const scale = stageScale > 0 ? stageScale : 1;
  const ratio = exportPixelRatio(scale);
  return {
    width: Math.round(sheet.width * scale * ratio),
    height: Math.round(sheet.height * scale * ratio),
  };
}
