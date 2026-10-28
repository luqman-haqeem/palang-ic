import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Rect as KonvaRect, Stage } from "react-konva";
import { type SlotId, slotKind } from "@/domain/copyLayout";
import {
  cardImageGeometry,
  clampCropArea,
  type Crop,
  cropBox,
  type CropTarget,
  defaultCropArea,
  initialCrop,
  rotateCrop,
  rotatedSize,
  setCropOrientation,
  zoomCropArea,
} from "@/domain/crop";
import type { Orientation, Rect } from "@/domain/page";
import type { Scan } from "@/state/session";

type Props = {
  slot: SlotId;
  scan: Scan;
  /** The box's corner rounding in sheet px, previewed on the frame. */
  radius: number;
  onApply: (crop: Crop) => void;
  onCancel: () => void;
};

const LABEL: Record<SlotId, string> = { front: "front", back: "back", page: "page" };
const ZOOM_STEP = 1.25;
/** Zoom per pixel of wheel travel: one ~100px mouse notch is ~10%. A trackpad
 *  pinch arrives as ctrl+wheel in much smaller deltas, so it gets more per px. */
const WHEEL_ZOOM_PER_PX = 0.001;
const PINCH_ZOOM_PER_PX = 0.01;
const LINE_PX = 16;
const NUDGE_PX = 20;

type Point = { x: number; y: number };

/** A fixed frame of the slot's shape — a card, or an A4 Page — with the photo
 *  moved and pinch-zoomed beneath it. Every rule — the frame's shape, the photo
 *  always covering it, the zoom limit, rotation — lives in domain/crop; this
 *  only turns gestures into calls. */
export function CropEditor({ slot, scan, radius, onApply, onCancel }: Props) {
  const target: CropTarget = slotKind(slot) === "page" ? "page" : "card";
  const [crop, setCrop] = useState<Crop>(
    () => scan.crop ?? initialCrop(scan.width, scan.height, target),
  );
  const box = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  // Focus leaves whatever field the user was in, so keys reach the editor.
  useEffect(() => dialog.current?.focus(), []);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The whole photo as currently turned. The frame keeps its own orientation:
  // turning the photo never turns a Page's frame.
  const turned = rotatedSize(scan.width, scan.height, crop.rotation);
  const frameBox = cropBox(target, crop.orientation);
  const ratio = frameBox.width / frameBox.height;
  const frameWidth = Math.min(size.width * 0.9, size.height * 0.9 * ratio);
  const frame: Rect = {
    x: (size.width - frameWidth) / 2,
    y: (size.height - frameWidth / ratio) / 2,
    width: frameWidth,
    height: frameWidth / ratio,
  };

  /** Screen px per turned-photo px: the frame is the area, scaled. */
  const scaleFor = (area: Rect) => frame.width / area.width;

  /** Screen gestures become area changes against the latest crop, so a burst of
   *  pointer events never works from a stale frame. Ignored until the stage has
   *  been measured: a zero-width frame would divide the area into NaN. */
  function changeArea(next: (c: Crop, turned: { width: number; height: number }) => Rect) {
    if (frame.width <= 0) return;
    setCrop((c) => ({
      ...c,
      area: next(c, rotatedSize(scan.width, scan.height, c.rotation)),
    }));
  }

  function pan(dx: number, dy: number) {
    changeArea((c, turned) => {
      const scale = scaleFor(c.area);
      return clampCropArea(
        { ...c.area, x: c.area.x - dx / scale, y: c.area.y - dy / scale },
        turned.width,
        turned.height,
        target,
        c.orientation,
      );
    });
  }

  function zoom(factor: number, at: Point = centreOf(frame)) {
    changeArea((c, turned) => {
      const scale = scaleFor(c.area);
      const focus = {
        x: c.area.x + (at.x - frame.x) / scale,
        y: c.area.y + (at.y - frame.y) / scale,
      };
      return zoomCropArea(c.area, factor, focus, turned.width, turned.height, target, c.orientation);
    });
  }

  function turn(step: 90 | -90) {
    setCrop((c) => rotateCrop(c, step, scan.width, scan.height, target));
  }

  /** Reframes in the editor, for a card and a Page alike: it undoes the
   *  framing, keeping the turn and the frame's orientation, and nothing is
   *  applied until the user says so. */
  function reset() {
    changeArea((c, turned) =>
      defaultCropArea(turned.width, turned.height, target, c.orientation),
    );
  }

  function orient(orientation: Orientation) {
    setCrop((c) => setCropOrientation(c, orientation, scan.width, scan.height, target));
  }

  // Pointers: one drags the photo, two pinch it.
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; centre: Point } | null>(null);

  function local(e: React.PointerEvent): Point {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerMove(e: React.PointerEvent) {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    const now = local(e);
    pointers.current.set(e.pointerId, now);

    if (pointers.current.size === 1) {
      pan(now.x - previous.x, now.y - previous.y);
      return;
    }
    const [a, b] = [...pointers.current.values()];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const centre = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const last = pinch.current;
    pinch.current = { distance, centre };
    if (!last || last.distance === 0) return;
    zoom(distance / last.distance, centre);
    pan(centre.x - last.centre.x, centre.y - last.centre.y);
  }

  function release(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  }

  // React's wheel listener is passive, so it cannot stop the page scrolling.
  // Zoom follows how far the wheel moved, not how many events fired: a smooth
  // mouse or trackpad sends many tiny ones. Sideways-only scrolling is ignored.
  const zoomRef = useRef(zoom);
  useLayoutEffect(() => {
    zoomRef.current = zoom;
  });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY === 0) return;
      const px = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * LINE_PX : e.deltaY;
      const perPx = e.ctrlKey ? PINCH_ZOOM_PER_PX : WHEEL_ZOOM_PER_PX;
      const r = el.getBoundingClientRect();
      zoomRef.current(Math.exp(-px * perPx), {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /** Leaves modified keys to the browser (ctrl/cmd +/- is page zoom) and leaves
   *  keys typed into a field to the field. */
  function onKey(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, [contenteditable]")) return;
    const moves: Record<string, Point> = {
      ArrowLeft: { x: NUDGE_PX, y: 0 },
      ArrowRight: { x: -NUDGE_PX, y: 0 },
      ArrowUp: { x: 0, y: NUDGE_PX },
      ArrowDown: { x: 0, y: -NUDGE_PX },
    };
    if (e.key in moves) pan(moves[e.key].x, moves[e.key].y);
    else if (e.key === "+" || e.key === "=") zoom(ZOOM_STEP);
    else if (e.key === "-") zoom(1 / ZOOM_STEP);
    else if (e.key === "Escape") onCancel();
    else return;
    e.preventDefault();
  }
  const keysRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useLayoutEffect(() => {
    keysRef.current = onKey;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keysRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The whole turned photo, placed so `crop.area` lands exactly on the frame.
  const scale = scaleFor(crop.area);
  const photo = cardImageGeometry(
    { rotation: crop.rotation, area: { x: 0, y: 0, ...turned } },
    scan.width,
    scan.height,
    {
      x: frame.x - crop.area.x * scale,
      y: frame.y - crop.area.y * scale,
      width: turned.width * scale,
      height: turned.height * scale,
    },
  );
  const { crop: _whole, ...photoNode } = photo;
  const frameRadius = (radius * frame.width) / frameBox.width;
  const button = "rounded border border-neutral-300 px-3 py-1.5 text-sm";

  return (
    <div
      ref={dialog}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Crop the ${LABEL[slot]}`}
      className="fixed inset-0 z-50 flex bg-black/80 outline-none sm:items-center sm:justify-center sm:p-4"
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-w-[640px] sm:rounded-lg">
        <div className="flex items-center justify-between p-3">
          <h2 className="font-semibold">Crop the {LABEL[slot]}</h2>
          <div className="flex gap-1">
            {/* A Page's frame is turned on its own, apart from the photo: a
                document lying upright in a sideways photo needs no rotation. */}
            {target === "page" && (
              <div role="group" aria-label="Frame orientation" className="mr-2 flex gap-1">
                {(["portrait", "landscape"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={crop.orientation === o}
                    className={`${button} capitalize ${crop.orientation === o ? "bg-black text-white" : ""}`}
                    onClick={() => orient(o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
            <button type="button" className={button} onClick={() => turn(-90)} aria-label="Rotate left">
              ↺
            </button>
            <button type="button" className={button} onClick={() => turn(90)} aria-label="Rotate right">
              ↻
            </button>
          </div>
        </div>

        <div
          ref={box}
          className="min-h-0 flex-1 cursor-grab touch-none bg-neutral-900 select-none active:cursor-grabbing sm:h-[420px] sm:flex-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, local(e));
            pinch.current = null;
          }}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
        >
          {size.width > 0 && (
            <Stage width={size.width} height={size.height} listening={false}>
              <Layer>
                <KonvaImage image={scan.bitmap as unknown as CanvasImageSource} {...photoNode} />
              </Layer>
              <Layer>
                <KonvaRect width={size.width} height={size.height} fill="rgba(0,0,0,0.6)" />
                <KonvaRect
                  {...frame}
                  cornerRadius={frameRadius}
                  fill="#000"
                  globalCompositeOperation="destination-out"
                />
                <KonvaRect {...frame} cornerRadius={frameRadius} stroke="#fff" strokeWidth={2} />
              </Layer>
            </Stage>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" className={button} onClick={() => zoom(1 / ZOOM_STEP)} aria-label="Zoom out">
            −
          </button>
          <button type="button" className={button} onClick={() => zoom(ZOOM_STEP)} aria-label="Zoom in">
            +
          </button>
          <button type="button" className={button} onClick={reset}>
            Reset
          </button>
          <span className="flex-1" />
          <button type="button" className={button} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-black px-4 py-1.5 text-sm text-white"
            onClick={() => onApply(crop)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function centreOf(r: Rect): Point {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}
