import type Konva from "konva";
import { dataUrlToBlob } from "@/export/dataUrl";
import { exportPixelRatio } from "@/export/exportScale";

/** Nodes that exist only to help the user aim and must never reach a Copy:
 *  the dashed selection outline, and the dashed placeholder drawn in an empty
 *  card slot (which would otherwise print as a grey box on a one-sided Copy). */
export const PREVIEW_ONLY_NAMES = ["selection", "placeholder"] as const;

/** Renders the stage at 300dpi with the preview-only nodes hidden, and shows
 *  them again even if the render throws. */
export function renderToDataUrl(
  stage: Konva.Stage,
  opts: { mimeType: string; quality?: number },
): string {
  const hidden = PREVIEW_ONLY_NAMES.flatMap((name) => stage.find(`.${name}`)).filter((node) =>
    node.isVisible(),
  );
  for (const node of hidden) node.hide();
  try {
    return stage.toDataURL({ pixelRatio: exportPixelRatio(stage.scaleX()), ...opts });
  } finally {
    for (const node of hidden) node.show();
  }
}

/** Saves through a temporary object URL; nothing is uploaded anywhere. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Revoking synchronously after click() cancels the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** As a Blob rather than a data URL link, which some browsers refuse to
 *  download at a full A4-at-300dpi size. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  downloadBlob(dataUrlToBlob(dataUrl), filename);
}
