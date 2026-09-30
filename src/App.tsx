import { useReducer, useRef, useState } from "react";
import type Konva from "konva";
import type { CardFace } from "@/domain/page";
import { initialState, reducer } from "@/state/document";
import { PageStage } from "@/render/PageStage";

const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [state, dispatch] = useReducer(reducer, today(), initialState);
  const [selected, setSelected] = useState<CardFace | null>(null);
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
      <aside className="w-full lg:w-80">
        <h1 className="text-lg font-semibold">palang-ic</h1>
        <p className="mt-1 text-sm text-neutral-500">Controls arrive in the next tasks.</p>
      </aside>
    </main>
  );
}
