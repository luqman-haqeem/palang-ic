import type { CardFace } from "@/domain/page";

type Props = {
  face: CardFace;
  onReset: () => void;
};

/** Position is the only per-face control left; drag or arrow-key the band, and
 *  reset it here if it ends up somewhere unhelpful. */
export function PlacementControls({ face, onReset }: Props) {
  return (
    <button type="button" onClick={onReset} className="text-xs underline">
      Reset {face} position
    </button>
  );
}
