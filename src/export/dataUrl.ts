/** Turns a base64 data URL into a Blob.
 *
 *  A 2481x3509 PNG is roughly 10MB of base64, and several browsers cap
 *  anchor-triggered data: URL downloads well below that — presenting as "the
 *  export button does nothing". Downloads therefore go through object URLs. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("The page could not be encoded for download.");
  const [, mimeType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}
