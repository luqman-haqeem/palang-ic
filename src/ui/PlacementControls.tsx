import type { BandLayout, SlotId } from "@/domain/copyLayout";
import type { PalangPlacement } from "@/domain/palang";

type Props = {
  slot: SlotId;
  /** From the Copy layout: the band's centre as drawn, and the same bounds
   *  that limit dragging. */
  band: BandLayout;
  onChange: (patch: Partial<PalangPlacement>) => void;
  onReset: () => void;
};

/** Position is the only per-slot setting, because the fields that must stay
 *  legible sit differently on each Card face and on every Page. Sliders as
 *  well as dragging: dragging a small band with a thumb is fiddly, and the
 *  slider ends are the limits dragging stops at. */
export function PlacementControls({ slot, band, onChange, onReset }: Props) {
  const { cx, cy, bounds } = band;
  return (
    <fieldset className="rounded border border-neutral-200 p-3">
      <legend className="px-1 text-sm font-medium capitalize">{slot} position</legend>

      <label className="block text-xs">
        Left / right: {Math.round(cx - bounds.minX)}
        <input
          type="range"
          min={bounds.minX}
          max={bounds.maxX}
          step={1}
          value={cx}
          onChange={(e) => onChange({ cx: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <label className="block text-xs">
        Up / down: {Math.round(cy - bounds.minY)}
        <input
          type="range"
          min={bounds.minY}
          max={bounds.maxY}
          step={1}
          value={cy}
          onChange={(e) => onChange({ cy: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <button type="button" onClick={onReset} className="mt-1 text-xs underline">
        Reset {slot} position
      </button>
    </fieldset>
  );
}
