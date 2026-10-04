# palang-ic

A browser-local tool that adds a JPN-style **palang** to copies of a Malaysian
MyKad: two parallel lines with a restrictive sentence between them, composed
onto one A4 page and exported as PNG or PDF.

Built for my own use, because the service I was using gates exports behind paid
tokens for something that is ultimately a canvas and a download.

```
npm install && npm run dev
```

## What a palang is, and what it isn't

When you hand a photocopy of your IC to a bank, a telco or a landlord, the
convention in Malaysia is to strike it with a *palang* — two parallel lines with
the permitted purpose written between them, so the copy cannot be reused for
anything else.

**A palang is not a watermark.** A watermark obscures the document to deter
copying. A palang deliberately obscures nothing: JPN/MKN guidance is that the
IC number, name, date of birth and photo must all stay legible, because the
recipient still has to be able to verify the card. The whole design follows from
that one distinction — this tool will not redact, black out, or tile anything,
and it is the reason the band is short and sits in a corner rather than running
across the middle.

The tool does not enforce legibility for you. Look at the preview.

## Privacy

Scans never leave the machine. There is no server, no upload, no analytics, and
no account. Images are decoded into a canvas and dropped on reload — the only
thing persisted to `localStorage` is your list of previously used palang
sentences. Cloudflare serves the bundle and never sees a scan.

## Use

Scan both sides of the card as JPEG, PNG or WebP and drop them in. Type the
purpose — one free-text field, deliberately not a template, because every bank
and employer wants a different wording. Drag a band to position it, or click it
and nudge with the arrow keys (shift for 10px). Export as PNG or PDF.

Everything else — angle, length, text size, ink colour, opacity, corner radius
and per-face position — lives under **Advanced settings** as sliders.

## Engineering notes

The interesting problems here were all about correctness under coordinate
transforms, and the two worst bugs were caught in self-review rather than by a
user.

**One coordinate system.** The page is A4 at 96 dpi — 794 × 1123 logical px —
and everything (card slots, band geometry, drag bounds, placement storage) is
expressed in it. Export is purely a `pixelRatio` multiplication at the edge.
Mixing mm, CSS px and device px is how this category of app usually breaks.

**Export resolution was window-dependent.** Konva's `toDataURL` multiplies by
the stage's scale, and the stage scales to fit the viewport — so the exported
PDF came out at a different resolution depending on how wide the browser window
happened to be. Verified against `konva/lib/Stage.js`, then fixed by dividing
the stage scale back out, so export is always 2481 × 3509 px (300 dpi A4)
regardless of viewport.

**`toISOString()` is the wrong clock.** In UTC+8, the UTC date is *yesterday*
for the first eight hours of every day, so export filenames would have been
stamped a day early every morning. `isoToday` is built from local getters and
the suite pins `TZ=Asia/Kuala_Lumpur`.

**Rounding is a design decision, not a detail.** ID-1 is 85.6 × 54 mm. Rounding
the mm→px conversion uniformly gives a 324 px card; the spec wanted 323. Page
offsets round, card dimensions floor, and both rules are written down and tested
rather than discovered by eye.

**Clip the fitted image, not the slot.** Rounded corners are applied to the
letterboxed image rect — clipping the card slot instead would leave a scan with
a different aspect ratio showing square corners inside a rounded frame. Drawn
with `arcTo` rather than `roundRect` for older Safari.

**Preview chrome must not reach the export.** The selection outline and the
dashed empty-slot placeholder are found by name across the whole stage, hidden,
rendered, and restored.

**Geometry checked against the reference, not guessed.** The official sample was
measured by fitting a line through only the dark pixels falling outside the card
bounding box — on a white page those are unambiguously band, not card artwork.
It came out at −43.3° and −43.8° on the two faces, confirming the −45° default.

### Layout

`src/domain/` is dependency-free pure functions — layout maths, band geometry,
text fitting, clock, filenames — and carries almost all of the 123 tests.
`src/state/` is a reducer. `src/render/` is Konva and is verified by eye, since
jsdom has no canvas; the maths it depends on was pushed down into `domain` so it
could be tested without one.

`CONTEXT.md` is the glossary. `docs/superpowers/specs/` holds the design
document, including dated revision sections recording every decision that was
superseded and why.

## Stack

Vite 8, React 19, TypeScript 6 (`strict`, `verbatimModuleSyntax`,
`erasableSyntaxOnly`), react-konva for the canvas, jsPDF for the PDF, Tailwind
v4, oxlint, Vitest + jsdom, PWA via `vite-plugin-pwa`, deployed to Cloudflare
Workers static assets.

```bash
npm run dev        # dev server
npm test           # vitest
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm run deploy     # build + wrangler deploy
```

## Scope

Clean scans only — flatbed or a scanner app, JPEG/PNG/WebP. There is no
perspective correction for phone photos and no PDF input; if your scanner
outputs PDF, convert it first.

Not affiliated with, or derived from the code of, any commercial palang service.
Provided as-is — you are responsible for checking that your palang leaves the
required fields legible before you hand the copy over.

## Licence

MIT — see [LICENSE](LICENSE).
