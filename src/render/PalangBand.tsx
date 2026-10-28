import type Konva from "konva";
import { Group, Line, Text } from "react-konva";
import { type BandLayout, clampCentre } from "@/domain/copyLayout";
import { type BandStyle, fitFontSize, FONT_FLOOR } from "@/domain/palang";
import { boundDragPosition } from "@/render/dragBound";
import { FONT_FAMILY, measureText } from "@/render/measureText";

type Props = {
  /** Position and size, from the Copy layout. */
  band: BandLayout;
  /** Angle, ink and opacity only; its size is already in `band`. */
  style: BandStyle;
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
 *  paths call the same tested `clampCentre` with the layout's bounds, the drag
 *  through `boundDragPosition`, which converts the preview's screen px. */
export function PalangBand({ band, style, line, selected, onSelect, onDragEnd }: Props) {
  const { lineGap, strokeWidth, length, bounds } = band;
  const size = fitFontSize(line, length * 0.94, band.fontSize, FONT_FLOOR, measureText);
  const textWidth = measureText(line, size);
  const half = length / 2;

  return (
    <Group
      x={band.cx}
      y={band.cy}
      rotation={style.angleDeg}
      opacity={style.opacity}
      draggable
      dragBoundFunc={function (this: Konva.Node, pos) {
        return boundDragPosition(pos, this.getParent()!.getAbsoluteTransform().getMatrix(), bounds);
      }}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        const clamped = clampCentre(bounds, { cx: e.target.x(), cy: e.target.y() });
        // Snap the node too, so state and view cannot drift apart even if the
        // clamped value matches what state already holds.
        e.target.position({ x: clamped.cx, y: clamped.cy });
        onDragEnd(clamped);
      }}
    >
      <Line
        points={[-half, -lineGap / 2, half, -lineGap / 2]}
        stroke={style.ink}
        strokeWidth={strokeWidth}
      />
      <Line
        points={[-half, lineGap / 2, half, lineGap / 2]}
        stroke={style.ink}
        strokeWidth={strokeWidth}
      />
      <Text
        text={line}
        fontFamily={FONT_FAMILY}
        fontStyle="bold"
        fontSize={size}
        fill={style.ink}
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
