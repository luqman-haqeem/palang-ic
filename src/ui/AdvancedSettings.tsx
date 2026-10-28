import type { SlotId, SlotLayout } from "@/domain/copyLayout";
import type { DocumentKind } from "@/domain/document";
import type { BandStyle, PalangPlacement } from "@/domain/palang";
import { BandStyleControls } from "@/ui/BandStyleControls";
import { CardStyleControls } from "@/ui/CardStyleControls";
import { PlacementControls } from "@/ui/PlacementControls";
import { SettingsReadout } from "@/ui/SettingsReadout";

type Props = {
  kind: DocumentKind;
  /** The Copy layout's slots that have a Scan, each with a position control.
   *  The only source of positions and bounds, so the controls show what is
   *  drawn. */
  slots: SlotLayout[];
  /** Card corner rounding is a MyKad setting; a Page is always square. */
  showCornerRadius: boolean;
  style: BandStyle;
  cornerRadius: number;
  onStyleChange: (patch: Partial<BandStyle>) => void;
  onCornerRadiusChange: (radius: number) => void;
  onPlacementChange: (slot: SlotId, patch: Partial<PalangPlacement>) => void;
  onPlacementReset: (slot: SlotId) => void;
};

/** Collapsed by default. The built-in defaults are tuned to a real card, so
 *  most uses need none of this; it is here for the copy a recipient wants
 *  marked differently. */
export function AdvancedSettings({
  kind,
  slots,
  showCornerRadius,
  style,
  cornerRadius,
  onStyleChange,
  onCornerRadiusChange,
  onPlacementChange,
  onPlacementReset,
}: Props) {
  const positions = Object.fromEntries(
    slots.map(({ id, band }) => [id, { cx: band.cx, cy: band.cy }]),
  );
  return (
    <details className="rounded border border-neutral-200">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
        Advanced settings
      </summary>
      <div className="space-y-3 p-3 pt-0">
        <BandStyleControls kind={kind} style={style} onChange={onStyleChange} />
        {showCornerRadius && (
          <CardStyleControls cornerRadius={cornerRadius} onChange={onCornerRadiusChange} />
        )}
        {slots.map(({ id, band }) => (
          <PlacementControls
            key={id}
            slot={id}
            band={band}
            onChange={(patch) => onPlacementChange(id, patch)}
            onReset={() => onPlacementReset(id)}
          />
        ))}
        <SettingsReadout style={style} placements={positions} cornerRadius={cornerRadius} />
      </div>
    </details>
  );
}
