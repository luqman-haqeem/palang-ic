import { jsPDF } from "jspdf";
import { PAGE } from "@/domain/page";

export function buildPdfDoc(
  jpegDataUrl: string,
  orientation: "portrait" | "landscape" = "portrait", // PROTOTYPE
): jsPDF {
  if (!jpegDataUrl.startsWith("data:image/jpeg")) {
    throw new Error("The page could not be rendered as a JPEG for the PDF.");
  }
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation });
  const [w, h] = orientation === "landscape" ? [PAGE.heightMm, PAGE.widthMm] : [PAGE.widthMm, PAGE.heightMm];
  doc.addImage(jpegDataUrl, "JPEG", 0, 0, w, h);
  return doc;
}

export function buildPdfBlob(
  jpegDataUrl: string,
  orientation: "portrait" | "landscape" = "portrait", // PROTOTYPE
): Blob {
  return buildPdfDoc(jpegDataUrl, orientation).output("blob");
}
