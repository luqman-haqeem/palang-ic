import { PAGE } from "@/domain/page";

/** 300dpi over the 96dpi logical page. */
export const BASE_PIXEL_RATIO = 300 / 96;

/** Konva sizes the export canvas from `stage.width()`, and the preview stage is
 *  sized `PAGE.widthPx * scale` so it fits the viewport. Dividing the ratio by
 *  that scale makes the exported Copy 300dpi regardless of window width —
 *  without it a phone-width preview exports at roughly 124dpi and the IC number
 *  the palang exists to keep legible may not survive the print. */
export function exportPixelRatio(stageScale: number): number {
  const scale = stageScale > 0 ? stageScale : 1;
  return BASE_PIXEL_RATIO / scale;
}

export function exportedPixelSize(stageScale: number): { width: number; height: number } {
  const scale = stageScale > 0 ? stageScale : 1;
  const ratio = exportPixelRatio(scale);
  return {
    width: Math.round(PAGE.widthPx * scale * ratio),
    height: Math.round(PAGE.heightPx * scale * ratio),
  };
}
