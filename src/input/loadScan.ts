import type { Scan } from "@/state/document";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_EDGE = 2000;

export const REJECT_MESSAGE =
  "Only JPEG, PNG and WebP images are accepted. If your scanner produced a PDF, export it as JPEG first.";

export function validateFile(
  file: { type: string },
): { ok: true } | { ok: false; message: string } {
  return (ACCEPTED_TYPES as readonly string[]).includes(file.type)
    ? { ok: true }
    : { ok: false, message: REJECT_MESSAGE };
}

/** A card renders into a 323x204 box, which at 300dpi export is ~1011x638 real
 *  pixels, so source detail beyond MAX_EDGE is discarded regardless. Downscaling
 *  unconditionally removes the mobile-Safari blank-canvas failure class. */
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

export async function loadScan(file: File): Promise<Scan> {
  const check = validateFile(file);
  if (!check.ok) throw new Error(check.message);

  const source = await createImageBitmap(file);
  const target = downscaleTarget(source.width, source.height);

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
