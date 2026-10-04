import { cardCornerRadius, RADIUS_MAX, RADIUS_MIN } from "@/domain/page";

type Props = {
  cornerRadius: number;
  onChange: (radius: number) => void;
};

/** The default is the real ID-1 card radius. Adjustable because a scan that is
 *  already cropped tight to the card, or one with a dark background, can look
 *  better squared off. */
export function CardStyleControls({ cornerRadius, onChange }: Props) {
  const trueRadius = cardCornerRadius();

  return (
    <fieldset className="rounded border border-neutral-200 p-3">
      <legend className="px-1 text-sm font-medium">Card</legend>

      <label className="block text-xs">
        Corner radius: {cornerRadius}
        {cornerRadius === trueRadius && " (true card)"}
        <input
          type="range"
          min={RADIUS_MIN}
          max={RADIUS_MAX}
          step={1}
          value={cornerRadius}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
        />
      </label>

      <button type="button" onClick={() => onChange(trueRadius)} className="mt-1 text-xs underline">
        Reset to true card radius
      </button>
    </fieldset>
  );
}
