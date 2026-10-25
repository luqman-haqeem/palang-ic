import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Rect as KonvaRect, Stage } from "react-konva";
import {
  cardImageGeometry,
  cardRatio,
  clampCropArea,
  type Crop,
  defaultCropArea,
  initialCrop,
  rotateCrop,
  rotatedSize,
  zoomCropArea,
} from "@/domain/crop";
import { type CardFace, cardSize, type Rect } from "@/domain/page";
import type { Scan } from "@/state/document";

type Props = {
  face: CardFace;
  scan: Scan;
  /** The card's corner rounding in page px, previewed on the frame. */
  radius: number;
  onApply: (crop: Crop) => void;
  onCancel: () => void;
};

const LABEL: Record<CardFace, string> = { front: "front", back: "back" };
const ZOOM_STEP = 1.25;
const WHEEL_STEP = 1.1;
const NUDGE_PX = 20;

type Point = { x: number; y: number };

/** A fixed card-shaped frame with the photo moved and pinch-zoomed beneath it.
 *  Every rule — the photo always covering the frame, the 300dpi zoom limit,
 *  rotation — lives in domain/crop; this only turns gestures into calls. */
export function CropEditor({ face, scan, radius, onApply, onCancel }: Props) {
  const [crop, setCrop] = useState<Crop>(() => scan.crop ?? initialCrop(scan.width, scan.height));
  const box = useRef<HTMLDivElement>(null);
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

  const ratio = cardRatio();
  const frameWidth = Math.min(size.width * 0.9, size.height * 0.9 * ratio);
  const frame: Rect = {
    x: (size.width - frameWidth) / 2,
    y: (size.height - frameWidth / ratio) / 2,
    width: frameWidth,
    height: frameWidth / ratio,
  };

  /** Screen gestures become area changes against the latest crop, so a burst of
   *  pointer events never works from a stale frame. */
  function changeArea(next: (c: Crop, turned: { width: number; height: number }) => Rect) {
    setCrop((c) => ({
      ...c,
      area: next(c, rotatedSize(scan.width, scan.height, c.rotation)),
    }));
  }

  function pan(dx: number, dy: number) {
    changeArea((c, turned) => {
      const s = frame.width / c.area.width;
      return clampCropArea(
        { ...c.area, x: c.area.x - dx / s, y: c.area.y - dy / s },
        turned.width,
        turned.height,
      );
    });
  }

  function zoom(factor: number, at: Point = centreOf(frame)) {
    changeArea((c, turned) => {
      const s = frame.width / c.area.width;
      const focus = { x: c.area.x + (at.x - frame.x) / s, y: c.area.y + (at.y - frame.y) / s };
      return zoomCropArea(c.area, factor, focus, turned.width, turned.height);
    });
  }

  function turn(step: 90 | -90) {
    setCrop((c) => rotateCrop(c, step, scan.width, scan.height));
  }

  function reset() {
    changeArea((_, turned) => defaultCropArea(turned.width, turned.height));
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
  const zoomRef = useRef(zoom);
  useLayoutEffect(() => {
    zoomRef.current = zoom;
  });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomRef.current(e.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP, {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onKey(e: KeyboardEvent) {
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
  const turned = rotatedSize(scan.width, scan.height, crop.rotation);
  const s = frame.width / crop.area.width;
  const photo = cardImageGeometry(
    { rotation: crop.rotation, area: { x: 0, y: 0, ...turned } },
    scan.width,
    scan.height,
    {
      x: frame.x - crop.area.x * s,
      y: frame.y - crop.area.y * s,
      width: turned.width * s,
      height: turned.height * s,
    },
  );
  const { crop: _whole, ...placement } = photo;
  const frameRadius = (radius * frame.width) / cardSize().width;
  const button = "rounded border border-neutral-300 px-3 py-1.5 text-sm";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Crop the ${LABEL[face]}`}
      className="fixed inset-0 z-50 flex bg-black/80 sm:items-center sm:justify-center sm:p-4"
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-w-[640px] sm:rounded-lg">
        <div className="flex items-center justify-between p-3">
          <h2 className="font-semibold">Crop the {LABEL[face]}</h2>
          <div className="flex gap-1">
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
                <KonvaImage image={scan.bitmap as unknown as CanvasImageSource} {...placement} />
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
