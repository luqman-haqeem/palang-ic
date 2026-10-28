import { useEffect, useReducer, useRef, useState } from "react";
import type Konva from "konva";
import { isoToday } from "@/domain/clock";
import { exportFilename } from "@/domain/filename";
import { buildPdfBlob, sheetOrientation } from "@/export/buildPdf";
import { downloadBlob, downloadDataUrl, renderToDataUrl } from "@/export/renderToDataUrl";
import { copyLayout, kindSlots, type SlotId } from "@/domain/copyLayout";
import { needsCrop } from "@/domain/crop";
import { canExport, initialState, reducer } from "@/state/session";
import { forgetLine, loadLines, rememberLine } from "@/state/savedLines";
import { SheetStage } from "@/render/SheetStage";
import { AdvancedSettings } from "@/ui/AdvancedSettings";
import { CropEditor } from "@/ui/CropEditor";
import { Dropzone } from "@/ui/Dropzone";
import { ExportBar } from "@/ui/ExportBar";
import { KindToggle } from "@/ui/KindToggle";
import { PalangTextField } from "@/ui/PalangTextField";

const today = () => isoToday(new Date());

export default function App() {
  const [state, dispatch] = useReducer(reducer, today(), initialState);
  const [selected, setSelected] = useState<SlotId | null>(null);
  const [saved, setSaved] = useState(loadLines);
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [cropping, setCropping] = useState<SlotId | null>(null);

  function exportCopy(ext: "png" | "pdf") {
    const stage = stageRef.current;
    if (!stage) return;
    try {
      const filename = exportFilename(state.date, ext);
      if (ext === "png") {
        const url = renderToDataUrl(stage, { mimeType: "image/png" });
        downloadDataUrl(url, filename);
      } else {
        const jpeg = renderToDataUrl(stage, { mimeType: "image/jpeg", quality: 0.92 });
        downloadBlob(buildPdfBlob(jpeg, sheetOrientation(copyLayout(state).sheet)), filename);
      }
      setSaved(rememberLine(state.line));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The export failed.");
    }
  }

  // An installed PWA can sit open across midnight; re-read the date whenever the
  // tab becomes visible so the filename is never stamped with yesterday.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        dispatch({ type: "setDate", date: today() });
      }
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  // Arrow-key nudge: the difference between "close enough" and "exactly clear of
  // the IC number", which is this tool's one real precision requirement.
  useEffect(() => {
    if (!selected || cropping) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const step = e.shiftKey ? 10 : 1;
      const moves: Record<string, { cx?: number; cy?: number }> = {
        ArrowLeft: { cx: -step },
        ArrowRight: { cx: step },
        ArrowUp: { cy: -step },
        ArrowDown: { cy: step },
      };
      const move = moves[e.key];
      if (!move) return;
      e.preventDefault();
      const current = state.placements[selected];
      dispatch({
        type: "setPlacement",
        slot: selected,
        patch: { cx: current.cx + (move.cx ?? 0), cy: current.cy + (move.cy ?? 0) },
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, cropping, state.placements]);

  const slots = kindSlots(state.kind);
  const loaded = slots.filter((slot) => state.scans[slot]);
  const layout = copyLayout(state);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:flex-row">
      {cropping && state.scans[cropping] && (
        <CropEditor
          key={cropping}
          slot={cropping}
          scan={state.scans[cropping]}
          radius={cropping === "page" ? 0 : state.cornerRadius}
          onApply={(crop) => {
            dispatch({ type: "setCrop", slot: cropping, crop });
            setCropping(null);
          }}
          onCancel={() => setCropping(null)}
        />
      )}
      <section className="flex-1">
        <SheetStage
          state={state}
          layout={layout}
          selected={selected}
          onSelect={setSelected}
          onDragEnd={(slot, patch) => dispatch({ type: "setPlacement", slot, patch })}
          stageRef={stageRef}
        />
      </section>

      <aside className="w-full space-y-4 lg:w-80">
        <div>
          <h1 className="text-lg font-semibold">palang-ic</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Nothing leaves this device. A reload clears the session.
          </p>
        </div>

        <KindToggle
          kind={state.kind}
          onChange={(kind) => {
            setSelected(null);
            dispatch({ type: "setKind", kind });
          }}
        />

        {error && (
          <p role="alert" className="rounded bg-red-50 px-2 py-1 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {slots.map((slot) => (
            <Dropzone
              key={slot}
              slot={slot}
              scan={state.scans[slot]}
              onLoad={(scan) => {
                setError(null);
                dispatch({ type: "setScan", slot, scan });
                // Kept uncropped if the user cancels: nothing they chose is discarded.
                // A Page is shown whole until the user asks to crop it.
                if (slot !== "page" && needsCrop(scan.width, scan.height)) setCropping(slot);
              }}
              onEdit={() => setCropping(slot)}
              onRemove={() => dispatch({ type: "removeScan", slot })}
              onError={setError}
            />
          ))}
        </div>

        <PalangTextField
          kind={state.kind}
          line={state.line}
          saved={saved}
          onChange={(line) => dispatch({ type: "setLine", line })}
          onForget={(line) => setSaved(forgetLine(line))}
        />

        {loaded.length > 0 && (
          <AdvancedSettings
            kind={state.kind}
            slots={layout.slots.filter((slot) => state.scans[slot.id])}
            showCornerRadius={state.kind === "mykad"}
            style={state.style}
            placements={state.placements}
            cornerRadius={state.cornerRadius}
            onStyleChange={(patch) => dispatch({ type: "setStyle", patch })}
            onCornerRadiusChange={(radius) => dispatch({ type: "setCornerRadius", radius })}
            onPlacementChange={(slot, patch) => dispatch({ type: "setPlacement", slot, patch })}
            onPlacementReset={(slot) => dispatch({ type: "resetPlacement", slot })}
          />
        )}

        <ExportBar
          disabled={!canExport(state)}
          disabledReason={
            loaded.length === 0
              ? state.kind === "page"
                ? "Add a scan of the page."
                : "Add at least one scan."
              : "Write the palang text — an empty band grants no limit on use."
          }
          onExportPng={() => exportCopy("png")}
          onExportPdf={() => exportCopy("pdf")}
          onClearAll={() => {
            setSelected(null);
            setError(null);
            dispatch({ type: "clearAll", today: today() });
          }}
        />
      </aside>
    </main>
  );
}
