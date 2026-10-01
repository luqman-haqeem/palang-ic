import { ANGLE_MAX, ANGLE_MIN, type BandStyle, FONT_MAX, FONT_MIN } from "@/domain/palang";

type Props = {
  style: BandStyle;
  onChange: (patch: Partial<BandStyle>) => void;
};

/** One angle and one size for both faces: it is one palang, drawn by one hand. */
export function BandStyleControls({ style, onChange }: Props) {
  return (
    <fieldset className="rounded border border-neutral-200 p-3">
      <legend className="px-1 text-sm font-medium">Band</legend>

      <label className="block text-xs">
        Angle: {style.angleDeg}°
        <input
          type="range"
          min={ANGLE_MIN}
          max={ANGLE_MAX}
          step={1}
          value={style.angleDeg}
          onChange={(e) => onChange({ angleDeg: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <label className="block text-xs">
        Text size: {style.fontSize}
        <input
          type="range"
          min={FONT_MIN}
          max={FONT_MAX}
          step={1}
          value={style.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          className="w-full"
        />
      </label>
    </fieldset>
  );
}
