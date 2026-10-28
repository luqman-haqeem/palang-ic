import { jsPDF } from "jspdf";
import { type Orientation, oriented, SHEET } from "@/domain/sheet";

/** One A4 page the given way up, the JPEG laid edge to edge. The orientation
 *  is the Copy layout's sheet's, never assumed: a landscape Page drawn on a
 *  portrait PDF page would be stretched. */
export function buildPdfDoc(jpegDataUrl: string, orientation: Orientation): jsPDF {
  if (!jpegDataUrl.startsWith("data:image/jpeg")) {
    throw new Error("The sheet could not be rendered as a JPEG for the PDF.");
  }
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation });
  const { width, height } = oriented({ width: SHEET.widthMm, height: SHEET.heightMm }, orientation);
  doc.addImage(jpegDataUrl, "JPEG", 0, 0, width, height);
  return doc;
}

/** The PDF as a file to download, from the same one-page document. */
export function buildPdfBlob(jpegDataUrl: string, orientation: Orientation): Blob {
  return buildPdfDoc(jpegDataUrl, orientation).output("blob");
}
