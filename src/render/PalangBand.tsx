import type Konva from "konva";
import { Group, Line, Text } from "react-konva";
import { cardSize, type CardFace } from "@/domain/page";
import {
  bandGeometry,
  clampCentreToFace,
  fitFontSize,
  FONT_FLOOR,
  INK,
  type PalangPlacement,
} from "@/domain/palang";
import { FONT_FAMILY, measureText } from "@/render/measureText";

type Props = {
  face: CardFace;
  placement: PalangPlacement;
  line: string;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (patch: { cx: number; cy: number }) => void;
};

/** The group origin is the band centre, so rotation pivots about the centre and
 *  dragging moves cx/cy directly. Bounds are enforced on the node itself via
 *  `dragBoundFunc` as well as in the reducer: react-konva skips re-applying an
 *  x/y prop whose value is unchanged, so a reducer clamp that returns the value
 *  already in state would leave the band sitting where it was dropped. Both
 *  paths call the same tested `clampCentreToFace`. */
export function PalangBand({ face, placement, line, selected, onSelect, onDragEnd }: Props) {
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
      dragBoundFunc={(pos) => {
        const clamped = clampCentreToFace(face, { cx: pos.x, cy: pos.y });
        return { x: clamped.cx, y: clamped.cy };
      }}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        const clamped = clampCentreToFace(face, { cx: e.target.x(), cy: e.target.y() });
        // Snap the node too, so state and view cannot drift apart even if the
        // clamped value matches what state already holds.
        e.target.position({ x: clamped.cx, y: clamped.cy });
        onDragEnd(clamped);
      }}
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
