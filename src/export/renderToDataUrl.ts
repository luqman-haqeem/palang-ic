import type Konva from "konva";

export const EXPORT_PIXEL_RATIO = 300 / 96;

/** Hides the dashed selection outline before rendering, then restores it. The
 *  outline is found by name rather than by hiding its layer, because the palang
 *  bands live in that layer too and hiding it would omit them from the Copy. */
export function renderToDataUrl(
  stage: Konva.Stage,
  selectionLayer: Konva.Layer | null,
  opts: { mimeType: string; quality?: number },
): string {
  const outlines = selectionLayer?.find(".selection") ?? [];
  for (const outline of outlines) outline.hide();
  try {
    return stage.toDataURL({ pixelRatio: EXPORT_PIXEL_RATIO, ...opts });
  } finally {
    for (const outline of outlines) outline.show();
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  triggerDownload(dataUrl, filename);
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}
