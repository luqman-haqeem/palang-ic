import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Layer, Rect, Stage } from "react-konva";
import { PAGE, type CardFace } from "@/domain/page";
import type { SessionState } from "@/state/document";
import { CardSlot } from "@/render/CardSlot";
import { PalangBand } from "@/render/PalangBand";

const FACES: CardFace[] = ["front", "back"];

type Props = {
  state: SessionState;
  selected: CardFace | null;
  onSelect: (face: CardFace | null) => void;
  onDragEnd: (face: CardFace, patch: { cx: number; cy: number }) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
};

export function PageStage({
  state,
  selected,
  onSelect,
  onDragEnd,
  stageRef,
}: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const el = holder.current;
      if (!el) return;
      setScale(Math.min(el.clientWidth / PAGE.widthPx, 1));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div ref={holder} className="w-full">
      <Stage
        ref={stageRef}
        width={PAGE.widthPx * scale}
        height={PAGE.heightPx * scale}
        scale={{ x: scale, y: scale }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
        className="shadow-sm"
      >
        <Layer>
          <Rect x={0} y={0} width={PAGE.widthPx} height={PAGE.heightPx} fill="#ffffff" />
          {FACES.map((face) => (
            <CardSlot
              key={face}
              face={face}
              scan={state.scans[face]}
              radius={state.cornerRadius}
            />
          ))}
        </Layer>
        <Layer>
          {FACES.map((face) =>
            state.scans[face] ? (
              <PalangBand
                key={face}
                face={face}
                placement={state.placements[face]}
                style={state.style}
                line={state.line}
                selected={selected === face}
                onSelect={() => onSelect(face)}
                onDragEnd={(patch) => onDragEnd(face, patch)}
              />
            ) : null,
          )}
        </Layer>
      </Stage>
    </div>
  );
}
