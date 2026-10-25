import type Konva from "konva";
import { Group, Image as KonvaImage, Rect as KonvaRect } from "react-konva";
import type { SlotLayout } from "@/domain/copyLayout";
import { clampCornerRadius, type Rect } from "@/domain/page";
import type { Scan } from "@/state/session";

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

/** A thin reader of the Copy layout: every position and size comes from
 *  `layout`, and `scan` supplies only the pixels. */
type Props = { layout: SlotLayout; scan?: Scan };

export function CardSlot({ layout, scan }: Props) {
  const { slot, box, cornerRadius, image } = layout;

  if (!scan || !image) {
    return (
      <KonvaRect
        x={slot.x}
        y={slot.y}
        width={slot.width}
        height={slot.height}
        cornerRadius={cornerRadius}
        stroke="#d4d4d4"
        dash={[6, 6]}
        strokeWidth={1}
        listening={false}
        name="placeholder"
      />
    );
  }

  return (
    <Group clipFunc={(ctx) => roundedRectPath(ctx, box, cornerRadius)}>
      <KonvaImage image={scan.bitmap as unknown as CanvasImageSource} {...image} />
    </Group>
  );
}
