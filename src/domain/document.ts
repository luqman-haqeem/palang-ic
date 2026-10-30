import type { Crop } from "@/domain/crop";

/** What the user is making a Copy of. Always their choice, never guessed from a
 *  Scan: a card and a landscape A4 page are too close in shape to tell apart. */
export type DocumentKind = "mykad" | "page";

/** `bitmap` is always the original upload; a `crop` frames it at draw time and
 *  is dropped with it, so a new image never inherits the last one's framing. */
export type Scan = { width: number; height: number; bitmap: ImageBitmap; crop?: Crop };
