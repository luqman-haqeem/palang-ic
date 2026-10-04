import type Konva from "konva";
import { Group, Image as KonvaImage, Rect as KonvaRect } from "react-konva";
import {
  cardRect,
  clampCornerRadius,
  containFit,
  type CardFace,
  type Rect,
} from "@/domain/page";
import type { Scan } from "@/state/document";

/** Rounded-rect path, used as a clip so a scan's square corners do not read as
 *  a screenshot. `arcTo` rather than `roundRect` for older Safari. */
function roundedRectPath(ctx: Konva.Context, rect: Rect, radius: number): void {
  const { x, y, width, height } = rect;
  const r = clampCornerRadius(radius, width, height);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

type Props = { face: CardFace; scan?: Scan; radius: number };

export function CardSlot({ face, scan, radius }: Props) {
  const rect = cardRect(face);

  if (!scan) {
    return (
      <KonvaRect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        cornerRadius={radius}
        stroke="#d4d4d4"
        dash={[6, 6]}
        strokeWidth={1}
        listening={false}
        name="placeholder"
      />
    );
  }

  const fitted = containFit(scan.width, scan.height, rect);

  // Clipped to the fitted image, not the slot: a scan whose aspect ratio differs
  // from the card is letterboxed, and rounding the slot would leave the image's
  // own corners square inside it.
  return (
    <Group clipFunc={(ctx) => roundedRectPath(ctx, fitted, radius)}>
      <KonvaImage
        image={scan.bitmap as unknown as CanvasImageSource}
        x={fitted.x}
        y={fitted.y}
        width={fitted.width}
        height={fitted.height}
      />
    </Group>
  );
}
