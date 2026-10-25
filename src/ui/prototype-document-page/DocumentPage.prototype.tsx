// PROTOTYPE — throwaway. Lives on branch prototype/document-page only; never merge.
//
// Question (grilling Q2): for a full-page document (surat beranak, sijil SPM),
// what should the Copy look like? Three page compositions, switchable via
// `?variant=` inside the real app, sharing the real palang text and band style.
//
//   A  Edge to edge      — scan contain-fit to the whole A4 page, no margin.
//   B  Photocopy margin  — scan inside 15mm margins, thin grey document edge,
//                          band free to overhang into the margin.
//   C  Follows the scan  — page turns landscape when the scan is landscape,
//                          10mm margin. (PNG export only; the real PDF builder
//                          is portrait-only, so a landscape PDF will stretch.)
//   D  A + C, contained  — edge to edge like A, page orientation follows the
//                          scan like C, and the whole band (lines, ends and
//                          text) is kept inside the A4 page: never cut off by
//                          the page edge. The band shortens if it cannot fit
//                          at the chosen angle. Landscape PDF export works.
//
// Band scaling in all three: font size and length scale by document width /
// card width, so the band keeps the proportions it has on a MyKad.
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Group, Layer, Line, Rect, Stage, Text, Image as KonvaImage } from "react-konva";
import { cardSize, containFit, mmToPx, PAGE, type Rect as R } from "@/domain/page";
import { bandGeometry, type BandStyle, fitFontSize, FONT_FLOOR } from "@/domain/palang";
import { loadScan } from "@/input/loadScan";
import type { Scan } from "@/state/document";
import { FONT_FAMILY, measureText } from "@/render/measureText";
import { PrototypeSwitcher, readVariant } from "./PrototypeSwitcher";

const VARIANTS = [
  { key: "A", name: "Edge to edge" },
  { key: "B", name: "Photocopy margin" },
  { key: "C", name: "Follows the scan" },
  { key: "D", name: "A + C, band inside page" },
];

/** Half-width and half-height of the band's rotated bounding box. */
function bandExtents(length: number, halfThick: number, angleDeg: number) {
  const t = (angleDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(t));
  const s = Math.abs(Math.sin(t));
  return { ex: c * (length / 2) + s * halfThick, ey: s * (length / 2) + c * halfThick };
}

/** Longest band that fits the page at this angle. */
function maxLengthOnPage(pageW: number, pageH: number, halfThick: number, angleDeg: number) {
  const t = (angleDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(t));
  const s = Math.abs(Math.sin(t));
  const byW = c > 1e-6 ? (pageW - 2 * s * halfThick) / c : Infinity;
  const byH = s > 1e-6 ? (pageH - 2 * c * halfThick) / s : Infinity;
  return Math.max(0, Math.min(byW, byH));
}

/** Keeps the whole band on the page; within that, keeps its centre on the
 *  document where the two ranges overlap. */
function clampInside(
  p: { x: number; y: number },
  ext: { ex: number; ey: number },
  pageW: number,
  pageH: number,
  doc: R,
) {
  const axis = (v: number, lo: number, hi: number, dlo: number, dhi: number) => {
    const a = Math.max(lo, dlo);
    const b = Math.min(hi, dhi);
    const [min, max] = a <= b ? [a, b] : [lo, hi];
    return min > max ? (lo + hi) / 2 : Math.min(Math.max(v, min), max);
  };
  return {
    x: axis(p.x, ext.ex, pageW - ext.ex, doc.x, doc.x + doc.width),
    y: axis(p.y, ext.ey, pageH - ext.ey, doc.y, doc.y + doc.height),
  };
}

type Layout = { pageW: number; pageH: number; doc: R; edge: boolean };

function layoutFor(variant: string, scan: Scan | null): Layout {
  const landscape = (variant === "C" || variant === "D") && scan !== null && scan.width > scan.height;
  const pageW = landscape ? PAGE.heightPx : PAGE.widthPx;
  const pageH = landscape ? PAGE.widthPx : PAGE.heightPx;
  const margin = variant === "A" || variant === "D" ? 0 : variant === "B" ? mmToPx(15) : mmToPx(10);
  const box = { x: margin, y: margin, width: pageW - margin * 2, height: pageH - margin * 2 };
  const doc = scan ? containFit(scan.width, scan.height, box) : box;
  return { pageW, pageH, doc, edge: variant === "B" };
}

type Props = { style: BandStyle; line: string; stageRef: React.RefObject<Konva.Stage | null> };

export function DocumentPagePrototype({ style, line, stageRef }: Props) {
  const [variant, setVariant] = useState(() => readVariant("D"));
  const [scan, setScan] = useState<Scan | null>(null);
  const [centre, setCentre] = useState<{ fx: number; fy: number }>({ fx: 0.16, fy: 0.1 });
  const [error, setError] = useState<string | null>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [holderW, setHolderW] = useState(800);

  useEffect(() => {
    const fit = () => holder.current && setHolderW(holder.current.clientWidth);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const { pageW, pageH, doc, edge } = layoutFor(variant, scan);
  const scale = Math.min(holderW / pageW, 1);

  // Band scaled from card proportions to document proportions.
  const k = doc.width / cardSize().width;
  const contained = variant === "D";
  const geo = bandGeometry(style.fontSize * k, doc.width, style.lengthFactor);
  const { lineGap, strokeWidth } = geo;
  const halfThick = lineGap / 2 + strokeWidth / 2;
  const length = contained
    ? Math.min(geo.length, maxLengthOnPage(pageW, pageH, halfThick, style.angleDeg))
    : geo.length;
  const size = fitFontSize(line, length * 0.94, style.fontSize * k, FONT_FLOOR, measureText);
  const textWidth = measureText(line, size);
  const half = length / 2;
  const ext = bandExtents(length, halfThick, style.angleDeg);
  const raw = { x: doc.x + centre.fx * doc.width, y: doc.y + centre.fy * doc.height };
  const { x: cx, y: cy } = contained ? clampInside(raw, ext, pageW, pageH, doc) : raw;

  async function accept(file: File | undefined) {
    if (!file) return;
    try {
      setScan(await loadScan(file));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That image could not be read.");
    }
  }

  return (
    <div ref={holder} className="w-full space-y-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void accept(e.dataTransfer.files[0]);
        }}
        className="flex items-center justify-between rounded border border-dashed border-fuchsia-400 p-2 text-sm"
      >
        <span>
          Document page {scan ? `· ${scan.width} × ${scan.height}` : "· drop a JPEG, PNG or WebP"}
        </span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void accept(e.target.files?.[0])} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <pre className="rounded bg-neutral-100 p-2 text-xs">
        {JSON.stringify(
          {
            variant,
            page: `${pageW}×${pageH}`,
            doc: { x: Math.round(doc.x), y: Math.round(doc.y), w: Math.round(doc.width), h: Math.round(doc.height) },
            bandScale: k.toFixed(2),
            bandLength: `${Math.round(length)}${contained && length < geo.length ? " (shortened to fit)" : ""}`,
            fontPx: size,
            centre: { fx: centre.fx.toFixed(3), fy: centre.fy.toFixed(3) },
          },
          null,
          0,
        )}
      </pre>
      <Stage ref={stageRef} width={pageW * scale} height={pageH * scale} scale={{ x: scale, y: scale }} className="shadow-sm">
        <Layer>
          <Rect x={0} y={0} width={pageW} height={pageH} fill="#ffffff" />
          {scan ? (
            <KonvaImage image={scan.bitmap as unknown as CanvasImageSource} x={doc.x} y={doc.y} width={doc.width} height={doc.height} />
          ) : (
            <Rect {...doc} stroke="#d4d4d4" dash={[6, 6]} strokeWidth={1} listening={false} name="placeholder" />
          )}
          {scan && edge && <Rect {...doc} stroke="#a3a3a3" strokeWidth={0.75} listening={false} />}
        </Layer>
        <Layer>
          {scan && (
            <Group
              x={cx}
              y={cy}
              rotation={style.angleDeg}
              opacity={style.opacity}
              draggable
              dragBoundFunc={(pos) => {
                if (contained) {
                  const c = clampInside({ x: pos.x / scale, y: pos.y / scale }, ext, pageW, pageH, doc);
                  return { x: c.x * scale, y: c.y * scale };
                }
                return {
                  x: Math.min(Math.max(pos.x, doc.x * scale), (doc.x + doc.width) * scale),
                  y: Math.min(Math.max(pos.y, doc.y * scale), (doc.y + doc.height) * scale),
                };
              }}
              onDragEnd={(e) =>
                setCentre({ fx: (e.target.x() - doc.x) / doc.width, fy: (e.target.y() - doc.y) / doc.height })
              }
            >
              <Line points={[-half, -lineGap / 2, half, -lineGap / 2]} stroke={style.ink} strokeWidth={strokeWidth} />
              <Line points={[-half, lineGap / 2, half, lineGap / 2]} stroke={style.ink} strokeWidth={strokeWidth} />
              <Text text={line} fontFamily={FONT_FAMILY} fontStyle="bold" fontSize={size} fill={style.ink} offsetX={textWidth / 2} offsetY={size / 2} />
            </Group>
          )}
        </Layer>
      </Stage>
      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={setVariant} />
    </div>
  );
}
