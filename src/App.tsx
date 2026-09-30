import { useReducer, useRef, useState } from "react";
import type Konva from "konva";
import type { CardFace } from "@/domain/page";
import { initialState, reducer } from "@/state/document";
import { forget, loadSaved } from "@/state/savedRecipients";
import { PageStage } from "@/render/PageStage";
import { Dropzone } from "@/ui/Dropzone";
import { TextFields } from "@/ui/TextFields";

const FACES: CardFace[] = ["front", "back"];
const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [state, dispatch] = useReducer(reducer, today(), initialState);
  const [selected, setSelected] = useState<CardFace | null>(null);
  const [saved, setSaved] = useState(loadSaved);
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const selectionLayerRef = useRef<Konva.Layer | null>(null);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:flex-row">
      <section className="flex-1">
        <PageStage
          state={state}
          selected={selected}
          onSelect={setSelected}
          onDragEnd={(face, patch) => dispatch({ type: "setPlacement", face, patch })}
          stageRef={stageRef}
          selectionLayerRef={selectionLayerRef}
        />
      </section>

      <aside className="w-full space-y-4 lg:w-80">
        <div>
          <h1 className="text-lg font-semibold">palang-ic</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Nothing leaves this device. Keep the palang clear of the photo, name, IC number and
            date of birth.
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

        <TextFields
          text={state.text}
          saved={saved}
          onField={(field, value) => dispatch({ type: "setField", field, value })}
          onEditLine={(line) => dispatch({ type: "editLine", line })}
          onResetLine={() => dispatch({ type: "resetLine" })}
          onForget={(field, value) => setSaved(forget(field, value))}
        />
      </aside>
    </main>
  );
}
