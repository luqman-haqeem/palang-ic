/** A generic name plus the date. Deliberately carries nothing from the palang
 *  text: the user writes that freely and it may name a bank or a loan, which
 *  has no business being the first thing visible in a downloads folder or an
 *  email attachment list. */
export function exportFilename(isoDate: string, ext: "png" | "pdf"): string {
  return `salinan-${isoDate}.${ext}`;
}
