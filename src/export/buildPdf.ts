import { jsPDF } from "jspdf";
import { PAGE } from "@/domain/page";

export function buildPdfDoc(jpegDataUrl: string): jsPDF {
  if (!jpegDataUrl.startsWith("data:image/jpeg")) {
    throw new Error("The page could not be rendered as a JPEG for the PDF.");
  }
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.addImage(jpegDataUrl, "JPEG", 0, 0, PAGE.widthMm, PAGE.heightMm);
  return doc;
}

export function buildPdfBlob(jpegDataUrl: string): Blob {
  return buildPdfDoc(jpegDataUrl).output("blob");
}
