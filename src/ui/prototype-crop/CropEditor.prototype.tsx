// PROTOTYPE — throwaway. Lives on branch prototype/crop only; never merge.
// Question (Q6): how should a phone user frame a MyKad inside a photo?
//   A — move/resize a card-shaped box over a fixed image
//   B — fixed card-shaped frame, drag + pinch-zoom the image underneath
//   C — tap two opposite corners of the card
// Every upload in dev opens this editor; Apply bakes the crop into the scan.
import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Image as KImage, Layer, Rect, Stage, Transformer } from "react-konva";
import type { Scan } from "@/state/document";
import { PrototypeSwitcher, readVariant } from "./PrototypeSwitcher";

Konva.hitOnDragEnabled = true;

const RATIO = 85.6 / 54;
const VARIANTS = [
  { key: "A", name: "Move a box" },
  { key: "B", name: "Pinch image under frame" },
  { key: "C", name: "Tap two corners" },
];

type Box = { x: number; y: number; width: number; height: number };
type Rotation = 0 | 90 | 180 | 270;
type VariantProps = {
  img: HTMLCanvasElement;
  W: number;
  H: number;
  onChange: (crop: Box) => void;
};

function rotate(bitmap: ImageBitmap, rot: Rotation): HTMLCanvasElement {
  const swap = rot === 90 || rot === 270;
  const c = document.createElement("canvas");
  c.width = swap ? bitmap.height : bitmap.width;
  c.height = swap ? bitmap.width : bitmap.height;
  const ctx = c.getContext("2d")!;
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  return c;
}

/** Largest card-shaped box centred in a w×h image. */
function defaultCrop(w: number, h: number): Box {
  const width = Math.min(w, h * RATIO);
  const height = width / RATIO;
  return { x: (w - width) / 2, y: (h - height) / 2, width, height };
}

function contain(iw: number, ih: number, W: number, H: number) {
  const s = Math.min(W / iw, H / ih);
  return { s, ox: (W - iw * s) / 2, oy: (H - ih * s) / 2 };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Darkens everything outside `box`. */
function Dim({ W, H, box }: { W: number; H: number; box: Box }) {
  const fill = "rgba(0,0,0,0.55)";
  return (
    <Group listening={false}>
      <Rect x={0} y={0} width={W} height={box.y} fill={fill} />
      <Rect x={0} y={box.y + box.height} width={W} height={H - box.y - box.height} fill={fill} />
      <Rect x={0} y={box.y} width={box.x} height={box.height} fill={fill} />
      <Rect
        x={box.x + box.width}
        y={box.y}
        width={W - box.x - box.width}
        height={box.height}
        fill={fill}
      />
    </Group>
  );
}

// ─── Variant A: move/resize a box ────────────────────────────────────────────
function VariantA({ img, W, H, onChange }: VariantProps) {
  const { s, ox, oy } = contain(img.width, img.height, W, H);
  const bounds = { x: ox, y: oy, width: img.width * s, height: img.height * s };
  const d = defaultCrop(img.width, img.height);
  const [box, setBox] = useState<Box>({
    x: ox + d.x * s,
    y: oy + d.y * s,
    width: d.width * s,
    height: d.height * s,
  });
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (rectRef.current && trRef.current) trRef.current.nodes([rectRef.current]);
  }, []);

  function sync() {
    const n = rectRef.current!;
    const next = {
      x: n.x(),
      y: n.y(),
      width: n.width() * n.scaleX(),
      height: n.height() * n.scaleY(),
    };
    setBox(next);
    onChange({
      x: (next.x - ox) / s,
      y: (next.y - oy) / s,
      width: next.width / s,
      height: next.height / s,
    });
  }

  return (
    <Stage width={W} height={H}>
      <Layer>
        <KImage image={img} x={ox} y={oy} width={bounds.width} height={bounds.height} />
        <Dim W={W} H={H} box={box} />
        <Rect
          ref={rectRef}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          stroke="#fff"
          strokeWidth={2}
          draggable
          dragBoundFunc={(pos) => {
            const n = rectRef.current!;
            const w = n.width() * n.scaleX();
            const h = n.height() * n.scaleY();
            return {
              x: clamp(pos.x, bounds.x, bounds.x + bounds.width - w),
              y: clamp(pos.y, bounds.y, bounds.y + bounds.height - h),
            };
          }}
          onDragMove={sync}
          onTransform={sync}
        />
        <Transformer
          ref={trRef}
          keepRatio
          rotateEnabled={false}
          flipEnabled={false}
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          anchorSize={22}
          boundBoxFunc={(old, next) => {
            const inside =
              next.x >= bounds.x - 0.5 &&
              next.y >= bounds.y - 0.5 &&
              next.x + next.width <= bounds.x + bounds.width + 0.5 &&
              next.y + next.height <= bounds.y + bounds.height + 0.5;
            return inside && next.width > 40 ? next : old;
          }}
        />
      </Layer>
    </Stage>
  );
}

// ─── Variant B: fixed frame, pan + pinch the image ───────────────────────────
function VariantB({ img, W, H, onChange }: VariantProps) {
  const fw = Math.min(W * 0.9, H * 0.9 * RATIO);
  const fh = fw / RATIO;
  const frame = { x: (W - fw) / 2, y: (H - fh) / 2, width: fw, height: fh };
  const minScale = Math.max(fw / img.width, fh / img.height);
  const maxScale = minScale * 8;

  const fit = (v: { s: number; x: number; y: number }) => {
    const s = clamp(v.s, minScale, maxScale);
    return {
      s,
      x: clamp(v.x, frame.x + frame.width - img.width * s, frame.x),
      y: clamp(v.y, frame.y + frame.height - img.height * s, frame.y),
    };
  };
  const [view, setViewRaw] = useState(() =>
    fit({
      s: minScale,
      x: frame.x + (fw - img.width * minScale) / 2,
      y: frame.y + (fh - img.height * minScale) / 2,
    }),
  );
  const imgRef = useRef<Konva.Image>(null);
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);

  function setView(v: { s: number; x: number; y: number }) {
    const next = fit(v);
    setViewRaw(next);
    onChange({
      x: (frame.x - next.x) / next.s,
      y: (frame.y - next.y) / next.s,
      width: frame.width / next.s,
      height: frame.height / next.s,
    });
  }

  function zoomAbout(px: number, py: number, ns: number, from = view) {
    const k = clamp(ns, minScale, maxScale) / from.s;
    setView({ s: from.s * k, x: px - (px - from.x) * k, y: py - (py - from.y) * k });
  }

  return (
    <div className="relative">
      <Stage
        width={W}
        height={H}
        onWheel={(e) => {
          e.evt.preventDefault();
          const p = e.target.getStage()!.getPointerPosition()!;
          zoomAbout(p.x, p.y, view.s * (e.evt.deltaY < 0 ? 1.1 : 1 / 1.1));
        }}
        onTouchMove={(e) => {
          const t = e.evt.touches;
          if (t.length !== 2) return;
          e.evt.preventDefault();
          imgRef.current?.stopDrag();
          const rect = e.target.getStage()!.container().getBoundingClientRect();
          const ax = t[0].clientX - rect.left;
          const ay = t[0].clientY - rect.top;
          const bx = t[1].clientX - rect.left;
          const by = t[1].clientY - rect.top;
          const dist = Math.hypot(bx - ax, by - ay);
          const cx = (ax + bx) / 2;
          const cy = (ay + by) / 2;
          const last = pinch.current;
          pinch.current = { dist, cx, cy };
          if (!last) return;
          const k = clamp(view.s * (dist / last.dist), minScale, maxScale) / view.s;
          setView({
            s: view.s * k,
            x: cx - (last.cx - view.x) * k,
            y: cy - (last.cy - view.y) * k,
          });
        }}
        onTouchEnd={() => (pinch.current = null)}
      >
        <Layer>
          <KImage
            ref={imgRef}
            image={img}
            x={view.x}
            y={view.y}
            width={img.width * view.s}
            height={img.height * view.s}
            draggable
            dragBoundFunc={(pos) => {
              const f = fit({ s: view.s, x: pos.x, y: pos.y });
              return { x: f.x, y: f.y };
            }}
            onDragMove={(e) => setView({ s: view.s, x: e.target.x(), y: e.target.y() })}
          />
          <Dim W={W} H={H} box={frame} />
          <Rect {...frame} stroke="#fff" strokeWidth={2} listening={false} cornerRadius={8} />
        </Layer>
      </Stage>
      <div className="absolute right-2 bottom-2 flex gap-1">
        {[
          ["−", 1 / 1.25],
          ["+", 1.25],
        ].map(([label, f]) => (
          <button
            key={label}
            type="button"
            className="h-9 w-9 rounded-full bg-white/90 text-lg shadow"
            onClick={() =>
              zoomAbout(frame.x + frame.width / 2, frame.y + frame.height / 2, view.s * (f as number))
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Variant C: tap two opposite corners ─────────────────────────────────────
function VariantC({ img, W, H, onChange }: VariantProps) {
  const { s, ox, oy } = contain(img.width, img.height, W, H);
  const [taps, setTaps] = useState<{ x: number; y: number }[]>([]);

  const box = useMemo(() => {
    if (taps.length < 2) return null;
    const [a, b] = taps;
    const bw = Math.abs(b.x - a.x);
    const bh = Math.abs(b.y - a.y);
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    let width = Math.max(bw, bh * RATIO);
    width = Math.min(width, img.width, img.height * RATIO);
    const height = width / RATIO;
    return {
      x: clamp(cx - width / 2, 0, img.width - width),
      y: clamp(cy - height / 2, 0, img.height - height),
      width,
      height,
    };
  }, [taps, img]);

  useEffect(() => {
    if (box) onChange(box);
  }, [box, onChange]);

  const toStage = (b: Box) => ({
    x: ox + b.x * s,
    y: oy + b.y * s,
    width: b.width * s,
    height: b.height * s,
  });

  return (
    <div className="relative">
      <Stage
        width={W}
        height={H}
        onPointerDown={(e) => {
          const p = e.target.getStage()!.getPointerPosition()!;
          const pt = {
            x: clamp((p.x - ox) / s, 0, img.width),
            y: clamp((p.y - oy) / s, 0, img.height),
          };
          setTaps((t) => (t.length >= 2 ? [pt] : [...t, pt]));
        }}
      >
        <Layer>
          <KImage image={img} x={ox} y={oy} width={img.width * s} height={img.height * s} />
          {box && <Dim W={W} H={H} box={toStage(box)} />}
          {box && <Rect {...toStage(box)} stroke="#fff" strokeWidth={2} listening={false} />}
          {taps.map((t, i) => (
            <Circle
              key={i}
              x={ox + t.x * s}
              y={oy + t.y * s}
              radius={9}
              stroke="#fff"
              strokeWidth={3}
              fill="#d946ef"
              listening={false}
            />
          ))}
        </Layer>
      </Stage>
      <p className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
        {taps.length === 0 && "Tap one corner of the card"}
        {taps.length === 1 && "Now tap the opposite corner"}
        {taps.length === 2 && "Tap again to start over"}
      </p>
    </div>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────
type Props = { scan: Scan; onApply: (scan: Scan) => void; onCancel: () => void };

export function CropEditorPrototype({ scan, onApply, onCancel }: Props) {
  const [variant, setVariant] = useState(() => readVariant("A"));
  const [rotation, setRotation] = useState<Rotation>(0);
  const img = useMemo(() => rotate(scan.bitmap, rotation), [scan, rotation]);
  const [crop, setCrop] = useState<Box>(() => defaultCrop(img.width, img.height));
  const [size] = useState(() => ({
    W: Math.min(window.innerWidth - 24, 640),
    H: Math.min(Math.round(window.innerHeight * 0.6), 520),
  }));

  // Rotation (Q10) and variant switches reset the framing.
  useEffect(() => setCrop(defaultCrop(img.width, img.height)), [img, variant]);

  function turn(step: 90 | -90) {
    setRotation((r) => (((r + step + 360) % 360) as Rotation));
  }

  async function apply() {
    const c = document.createElement("canvas");
    c.width = Math.round(crop.width);
    c.height = Math.round(crop.height);
    c.getContext("2d")!.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      c.width,
      c.height,
    );
    const bitmap = await createImageBitmap(c);
    onApply({ width: c.width, height: c.height, bitmap });
  }

  const Variant = { A: VariantA, B: VariantB, C: VariantC }[variant] ?? VariantA;
  const r = (n: number) => Math.round(n);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/80 p-3">
      <div className="w-full max-w-[664px] rounded-lg bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Crop your card</h2>
          <div className="flex gap-1">
            <button type="button" className="rounded border px-3 py-1" onClick={() => turn(-90)}>
              ↺
            </button>
            <button type="button" className="rounded border px-3 py-1" onClick={() => turn(90)}>
              ↻
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded bg-neutral-900" style={{ touchAction: "none" }}>
          <Variant
            key={`${variant}-${rotation}`}
            img={img}
            W={size.W}
            H={size.H}
            onChange={setCrop}
          />
        </div>

        <pre className="mt-2 rounded bg-neutral-100 p-2 text-[11px] leading-tight">
          {`variant  ${variant}\nrotation ${rotation}°\nimage    ${img.width}×${img.height}\ncrop     x=${r(crop.x)} y=${r(crop.y)} ${r(crop.width)}×${r(crop.height)}  ratio ${(crop.width / crop.height).toFixed(3)}\nexport   ${crop.width >= 1011 ? "✓" : "⚠ below"} 1011px wide for 300dpi`}
        </pre>

        <div className="mt-2 mb-12 flex justify-end gap-2">
          <button type="button" className="rounded border px-4 py-2" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-black px-4 py-2 text-white"
            onClick={() => void apply()}
          >
            Apply
          </button>
        </div>
      </div>
      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={setVariant} />
    </div>
  );
}
