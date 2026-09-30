# palang-ic

Adds a JPN-style **palang** to copies of a MyKad: two parallel lines with a
restrictive sentence between them, naming the recipient, the purpose and the
date. Front and back go onto one A4 page, exportable as PNG or PDF.

Everything happens in the browser. Scans are never uploaded and never written
to storage — a reload loses the session by design. See `CONTEXT.md` for the
vocabulary and `docs/superpowers/specs/` for the design.

## Use

Scan or photocopy both sides of the card as JPEG, PNG or WebP. Drop them in,
fill in the purpose and recipient, drag each band clear of the photo, name, IC
number and date of birth, then export.

The palang must not obscure those fields: the recipient still has to be able to
verify the card. The tool does not check this for you — look at the preview.

Drag a band to move it; click it and use the arrow keys to nudge by 1px, or
shift-arrow for 10px. Angle and text size are sliders. The composed sentence is
editable; editing it by hand detaches it from the fields until you press
"Reset to template".

## Develop

```bash
npm install
npm run dev        # dev server
npm test           # vitest
npm run typecheck  # tsc -b
npm run lint       # oxlint
```

Layout maths, the sentence template, text fitting and filenames live in
`src/domain/` as pure functions and carry the tests. The Konva components in
`src/render/` are verified by eye — jsdom has no canvas.

## Deploy

Cloudflare Workers with a static assets binding; Cloudflare serves the bundle
and never sees a scan.

```bash
npx wrangler login   # first time only
npm run deploy
```
