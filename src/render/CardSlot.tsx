import { Image as KonvaImage, Rect as KonvaRect } from "react-konva";
import { cardRect, containFit, type CardFace } from "@/domain/page";
import type { Scan } from "@/state/document";

export function CardSlot({ face, scan }: { face: CardFace; scan?: Scan }) {
  const rect = cardRect(face);

  if (!scan) {
    return (
      <KonvaRect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        stroke="#d4d4d4"
        dash={[6, 6]}
        strokeWidth={1}
        listening={false}
        name="placeholder"
      />
    );
  }

  const fitted = containFit(scan.width, scan.height, rect);
  return (
    <KonvaImage
      image={scan.bitmap as unknown as CanvasImageSource}
      x={fitted.x}
      y={fitted.y}
      width={fitted.width}
      height={fitted.height}
    />
  );
}
