import { useEffect, useReducer, useRef, useState } from "react";
import type Konva from "konva";
import { isoToday } from "@/domain/clock";
import { exportFilename } from "@/domain/filename";
import type { CardFace } from "@/domain/page";
import { buildPdfBlob } from "@/export/buildPdf";
import { downloadBlob, downloadDataUrl, renderToDataUrl } from "@/export/renderToDataUrl";
import { canExport, initialState, reducer } from "@/state/document";
import { forgetLine, loadLines, rememberLine } from "@/state/savedLines";
import { PageStage } from "@/render/PageStage";
import { BandStyleControls } from "@/ui/BandStyleControls";
import { Dropzone } from "@/ui/Dropzone";
import { ExportBar } from "@/ui/ExportBar";
import { PalangTextField } from "@/ui/PalangTextField";
import { PlacementControls } from "@/ui/PlacementControls";

const FACES: CardFace[] = ["front", "back"];
const today = () => isoToday(new Date());

export default function App() {
  const [state, dispatch] = useReducer(reducer, today(), initialState);
  const [selected, setSelected] = useState<CardFace | null>(null);
  const [saved, setSaved] = useState(loadLines);
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

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
        downloadBlob(buildPdfBlob(jpeg), filename);
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
    if (!selected) return;
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
        face: selected,
        patch: { cx: current.cx + (move.cx ?? 0), cy: current.cy + (move.cy ?? 0) },
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, state.placements]);

  const loadedFaces = FACES.filter((face) => state.scans[face]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:flex-row">
      <section className="flex-1">
        <PageStage
          state={state}
          selected={selected}
          onSelect={setSelected}
          onDragEnd={(face, patch) => dispatch({ type: "setPlacement", face, patch })}
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

        {error && (
          <p role="alert" className="rounded bg-red-50 px-2 py-1 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {FACES.map((face) => (
            <Dropzone
              key={face}
              face={face}
              scan={state.scans[face]}
              onLoad={(scan) => {
                setError(null);
                dispatch({ type: "setScan", face, scan });
              }}
              onRemove={() => dispatch({ type: "removeScan", face })}
              onError={setError}
            />
          ))}
        </div>

        <PalangTextField
          line={state.line}
          saved={saved}
          onChange={(line) => dispatch({ type: "setLine", line })}
          onForget={(line) => setSaved(forgetLine(line))}
        />

        {loadedFaces.length > 0 && (
          <>
            <BandStyleControls
              style={state.style}
              onChange={(patch) => dispatch({ type: "setStyle", patch })}
            />
            <div className="flex gap-3">
              {loadedFaces.map((face) => (
                <PlacementControls
                  key={face}
                  face={face}
                  onReset={() => dispatch({ type: "resetPlacement", face })}
                />
              ))}
            </div>
          </>
        )}

        <ExportBar
          disabled={!canExport(state)}
          disabledReason={
            loadedFaces.length === 0
              ? "Add at least one scan."
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
