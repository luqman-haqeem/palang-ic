import { jsPDF } from "jspdf";
import { SHEET } from "@/domain/sheet";

export type SheetOrientation = "portrait" | "landscape";

/** The sheet's orientation from its size: landscape when it is wider than
 *  tall, as a landscape Page's sheet is. */
export function sheetOrientation(sheet: { width: number; height: number }): SheetOrientation {
  return sheet.width > sheet.height ? "landscape" : "portrait";
}

export function buildPdfDoc(jpegDataUrl: string, orientation: SheetOrientation = "portrait"): jsPDF {
  if (!jpegDataUrl.startsWith("data:image/jpeg")) {
    throw new Error("The sheet could not be rendered as a JPEG for the PDF.");
  }
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation });
  const [width, height] =
    orientation === "landscape" ? [SHEET.heightMm, SHEET.widthMm] : [SHEET.widthMm, SHEET.heightMm];
  doc.addImage(jpegDataUrl, "JPEG", 0, 0, width, height);
  return doc;
}

export function buildPdfBlob(jpegDataUrl: string, orientation: SheetOrientation = "portrait"): Blob {
  return buildPdfDoc(jpegDataUrl, orientation).output("blob");
}
