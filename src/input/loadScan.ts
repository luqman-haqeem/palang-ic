import type { DocumentKind, Scan } from "@/state/session";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_EDGE = 4096;

export const REJECT_MESSAGE =
  "Only JPEG, PNG and WebP images are accepted. If your scanner produced a PDF, export it as JPEG first.";

export function validateFile(
  file: { type: string },
): { ok: true } | { ok: false; message: string } {
  return (ACCEPTED_TYPES as readonly string[]).includes(file.type)
    ? { ok: true }
    : { ok: false, message: REJECT_MESSAGE };
}

/** A card exports at ~1011x638 real pixels (300dpi), but a phone photo is
 *  cropped first, and the card may fill only half the frame — so the original
 *  keeps up to MAX_EDGE. 4096 on the long edge is ~12MP at 4:3, under mobile
 *  Safari's ~16.7MP canvas limit, so that blank-canvas failure class stays gone. */
export function downscaleTarget(
  width: number,
  height: number,
  maxEdge: number = MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** A Page must keep A4's long edge at 300dpi (297mm ≈ 3508px) so small print
 *  stays legible. MAX_EDGE already clears that, and a phone photo of a Page is
 *  cropped too, so the Page keeps the same headroom rather than a tighter cap. */
const MAX_EDGE_BY_KIND: Record<DocumentKind, number> = { mykad: MAX_EDGE, page: MAX_EDGE };

export function maxEdgeFor(kind: DocumentKind): number {
  return MAX_EDGE_BY_KIND[kind];
}

export async function loadScan(file: File, kind: DocumentKind): Promise<Scan> {
  const check = validateFile(file);
  if (!check.ok) throw new Error(check.message);

  const source = await createImageBitmap(file);
  const target = downscaleTarget(source.width, source.height, maxEdgeFor(kind));

  if (target.width === source.width && target.height === source.height) {
    return { width: source.width, height: source.height, bitmap: source };
  }

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image for display.");
  ctx.drawImage(source, 0, 0, target.width, target.height);
  source.close();

  const bitmap = await createImageBitmap(canvas);
  return { width: target.width, height: target.height, bitmap };
}
