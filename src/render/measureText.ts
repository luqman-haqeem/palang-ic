export const FONT_FAMILY = "Roboto Condensed";

let ctx: CanvasRenderingContext2D | null = null;

/** The bold band text's width, measured on one shared canvas so fitting the
 *  text to a band does not create a canvas per call. */
export function measureText(text: string, size: number): number {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * size * 0.5; // conservative fallback
  ctx.font = `bold ${size}px "${FONT_FAMILY}"`;
  return ctx.measureText(text).width;
}
