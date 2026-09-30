import type Konva from "konva";
import { Group, Line, Text } from "react-konva";
import { cardSize } from "@/domain/page";
import {
  bandGeometry,
  fitFontSize,
  FONT_FLOOR,
  INK,
  type PalangPlacement,
} from "@/domain/palang";
import { FONT_FAMILY, measureText } from "@/render/measureText";

type Props = {
  placement: PalangPlacement;
  line: string;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (patch: { cx: number; cy: number }) => void;
};

/** The group origin is the band centre, so rotation pivots about the centre and
 *  dragging moves cx/cy directly. Bounds are not enforced here: the reducer is
 *  the single place that knows them, and it is the tested one. */
export function PalangBand({ placement, line, selected, onSelect, onDragEnd }: Props) {
  const { width: cardWidth } = cardSize();
  const { lineGap, strokeWidth, length } = bandGeometry(placement.fontSize, cardWidth);
  const size = fitFontSize(line, length * 0.94, placement.fontSize, FONT_FLOOR, measureText);
  const textWidth = measureText(line, size);
  const half = length / 2;

  return (
    <Group
      x={placement.cx}
      y={placement.cy}
      rotation={placement.angleDeg}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) =>
        onDragEnd({ cx: e.target.x(), cy: e.target.y() })
      }
    >
      <Line
        points={[-half, -lineGap / 2, half, -lineGap / 2]}
        stroke={INK}
        strokeWidth={strokeWidth}
      />
      <Line
        points={[-half, lineGap / 2, half, lineGap / 2]}
        stroke={INK}
        strokeWidth={strokeWidth}
      />
      <Text
        text={line}
        fontFamily={FONT_FAMILY}
        fontStyle="bold"
        fontSize={size}
        fill={INK}
        offsetX={textWidth / 2}
        offsetY={size / 2}
      />
      {selected && (
        <Line
          points={[-half, -lineGap, half, -lineGap, half, lineGap, -half, lineGap]}
          closed
          stroke="#2563eb"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
          name="selection"
        />
      )}
    </Group>
  );
}
