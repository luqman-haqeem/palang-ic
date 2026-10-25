import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Layer, Rect, Stage } from "react-konva";
import type { CopyLayout, SlotId } from "@/domain/copyLayout";
import type { SessionState } from "@/state/session";
import { CardSlot } from "@/render/CardSlot";
import { PalangBand } from "@/render/PalangBand";

type Props = {
  state: SessionState;
  /** The geometry of everything drawn; `state` supplies only scans, text and ink. */
  layout: CopyLayout;
  selected: SlotId | null;
  onSelect: (id: SlotId | null) => void;
  onDragEnd: (id: SlotId, patch: { cx: number; cy: number }) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
};

export function PageStage({
  state,
  layout,
  selected,
  onSelect,
  onDragEnd,
  stageRef,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { sheet } = layout;

  useEffect(() => {
    const fit = () => {
      const el = holder.current;
      if (!el) return;
      setScale(Math.min(el.clientWidth / sheet.width, 1));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [sheet.width]);

  return (
    <div ref={holder} className="w-full">
      <Stage
        ref={stageRef}
        width={sheet.width * scale}
        height={sheet.height * scale}
        scale={{ x: scale, y: scale }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
        className="shadow-sm"
      >
        <Layer>
          <Rect x={0} y={0} width={sheet.width} height={sheet.height} fill="#ffffff" />
          {layout.slots.map((slot) => (
            <CardSlot key={slot.id} layout={slot} scan={state.scans[slot.id]} />
          ))}
        </Layer>
        <Layer>
          {layout.slots.map((slot) =>
            state.scans[slot.id] ? (
              <PalangBand
                key={slot.id}
                band={slot.band}
                style={state.style}
                line={state.line}
                selected={selected === slot.id}
                onSelect={() => onSelect(slot.id)}
                onDragEnd={(patch) => onDragEnd(slot.id, patch)}
              />
            ) : null,
          )}
        </Layer>
      </Stage>
    </div>
  );
}
