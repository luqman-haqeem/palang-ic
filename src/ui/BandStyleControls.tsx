import {
  ANGLE_MAX,
  ANGLE_MIN,
  type BandStyle,
  DEFAULT_INK,
  FONT_MAX,
  FONT_MIN,
  LENGTH_MAX,
  LENGTH_MIN,
  OPACITY_MAX,
  OPACITY_MIN,
} from "@/domain/palang";

/** Black is the default; the others are the colours people reach for when they
 *  want the mark to be obviously not part of the original document. */
const INK_PRESETS = [
  { label: "Black", value: DEFAULT_INK },
  { label: "Dark red", value: "#9b1c1c" },
  { label: "Navy", value: "#1e3a8a" },
];

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
        Length: {Math.round(style.lengthFactor * 100)}% of card width
        <input
          type="range"
          min={LENGTH_MIN}
          max={LENGTH_MAX}
          step={0.05}
          value={style.lengthFactor}
          onChange={(e) => onChange({ lengthFactor: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <div className="mt-1 text-xs">
        <span className="block">Colour</span>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="color"
            value={style.ink}
            onChange={(e) => onChange({ ink: e.target.value })}
            aria-label="Palang colour"
            className="h-7 w-10 rounded border border-neutral-300"
          />
          {INK_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange({ ink: preset.value })}
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={style.ink === preset.value}
              className={`h-7 w-7 rounded border ${
                style.ink === preset.value
                  ? "border-neutral-900 ring-1 ring-neutral-900"
                  : "border-neutral-300"
              }`}
              style={{ backgroundColor: preset.value }}
            />
          ))}
        </div>
      </div>

      <label className="block text-xs">
        Opacity: {Math.round(style.opacity * 100)}%
        <input
          type="range"
          min={OPACITY_MIN}
          max={OPACITY_MAX}
          step={0.05}
          value={style.opacity}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
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
