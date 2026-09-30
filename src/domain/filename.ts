export const SLUG_FALLBACK = "penerima";

export function slugRecipient(recipient: string): string {
  const slug = recipient
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || SLUG_FALLBACK;
}

export function exportFilename(
  recipient: string,
  isoDate: string,
  ext: "png" | "pdf",
): string {
  return `salinan-${slugRecipient(recipient)}-${isoDate}.${ext}`;
}
