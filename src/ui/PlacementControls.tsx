import type { CardFace } from "@/domain/page";
import {
  ANGLE_MAX,
  ANGLE_MIN,
  FONT_MAX,
  FONT_MIN,
  type PalangPlacement,
} from "@/domain/palang";

type Props = {
  face: CardFace;
  placement: PalangPlacement;
  onChange: (patch: Partial<PalangPlacement>) => void;
  onReset: () => void;
};

export function PlacementControls({ face, placement, onChange, onReset }: Props) {
  return (
    <fieldset className="rounded border border-neutral-200 p-3">
      <legend className="px-1 text-sm font-medium capitalize">{face} placement</legend>

      <label className="block text-xs">
        Angle: {placement.angleDeg}°
        <input
          type="range"
          min={ANGLE_MIN}
          max={ANGLE_MAX}
          step={1}
          value={placement.angleDeg}
          onChange={(e) => onChange({ angleDeg: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <label className="block text-xs">
        Text size: {placement.fontSize}
        <input
          type="range"
          min={FONT_MIN}
          max={FONT_MAX}
          step={1}
          value={placement.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <button type="button" onClick={onReset} className="mt-1 text-xs underline">
        Reset placement
      </button>
    </fieldset>
  );
}
