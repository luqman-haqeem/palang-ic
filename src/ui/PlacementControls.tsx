import type { CardFace } from "@/domain/page";
import { type PalangPlacement, placementBounds } from "@/domain/palang";

type Props = {
  face: CardFace;
  placement: PalangPlacement;
  onChange: (patch: Partial<PalangPlacement>) => void;
  onReset: () => void;
};

/** Position is the only per-face setting, because the fields that must stay
 *  legible sit differently on each side. Sliders as well as dragging: dragging
 *  a small band with a thumb is fiddly, and the slider ends are the card edges. */
export function PlacementControls({ face, placement, onChange, onReset }: Props) {
  const bounds = placementBounds(face);

  return (
    <fieldset className="rounded border border-neutral-200 p-3">
      <legend className="px-1 text-sm font-medium capitalize">{face} position</legend>

      <label className="block text-xs">
        Left / right: {placement.cx - bounds.minX}
        <input
          type="range"
          min={bounds.minX}
          max={bounds.maxX}
          step={1}
          value={placement.cx}
          onChange={(e) => onChange({ cx: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <label className="block text-xs">
        Up / down: {placement.cy - bounds.minY}
        <input
          type="range"
          min={bounds.minY}
          max={bounds.maxY}
          step={1}
          value={placement.cy}
          onChange={(e) => onChange({ cy: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <button type="button" onClick={onReset} className="mt-1 text-xs underline">
        Reset {face} position
      </button>
    </fieldset>
  );
}
