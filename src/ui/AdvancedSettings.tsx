import type { CardFace } from "@/domain/page";
import type { BandStyle, PalangPlacement } from "@/domain/palang";
import { BandStyleControls } from "@/ui/BandStyleControls";
import { CardStyleControls } from "@/ui/CardStyleControls";
import { PlacementControls } from "@/ui/PlacementControls";
import { SettingsReadout } from "@/ui/SettingsReadout";

type Props = {
  faces: CardFace[];
  style: BandStyle;
  placements: Record<CardFace, PalangPlacement>;
  cornerRadius: number;
  onStyleChange: (patch: Partial<BandStyle>) => void;
  onCornerRadiusChange: (radius: number) => void;
  onPlacementChange: (face: CardFace, patch: Partial<PalangPlacement>) => void;
  onPlacementReset: (face: CardFace) => void;
};

/** Collapsed by default. The built-in defaults are tuned to a real card, so
 *  most uses need none of this; it is here for the copy a recipient wants
 *  marked differently. */
export function AdvancedSettings({
  faces,
  style,
  placements,
  cornerRadius,
  onStyleChange,
  onCornerRadiusChange,
  onPlacementChange,
  onPlacementReset,
}: Props) {
  return (
    <details className="rounded border border-neutral-200">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
        Advanced settings
      </summary>
      <div className="space-y-3 p-3 pt-0">
        <BandStyleControls style={style} onChange={onStyleChange} />
        <CardStyleControls cornerRadius={cornerRadius} onChange={onCornerRadiusChange} />
        {faces.map((face) => (
          <PlacementControls
            key={face}
            face={face}
            placement={placements[face]}
            onChange={(patch) => onPlacementChange(face, patch)}
            onReset={() => onPlacementReset(face)}
          />
        ))}
        <SettingsReadout style={style} placements={placements} cornerRadius={cornerRadius} />
      </div>
    </details>
  );
}
