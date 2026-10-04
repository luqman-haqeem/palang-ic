# palang-ic

A browser-local tool that adds a **palang** to copies of a Malaysian MyKad:
two parallel lines with a restrictive sentence between them, composed onto one
A4 page and exported as PNG or PDF.

Built for my own use, because the service I was using gates exports behind paid
tokens for something that is ultimately a canvas and a download.

**[Try it →](https://palang-ic.luqmanhaqeem.workers.dev)** · or run it locally:

```
npm install && npm run dev
```

## What a palang is, and what it isn't

When you hand a photocopy of your IC to a bank, a telco or a landlord, the
convention in Malaysia is to strike it with a *palang* — two parallel lines with
the permitted purpose written between them, so the copy cannot be reused for
anything else.

**A palang is not a watermark.** A watermark obscures the document to deter
copying. A palang deliberately obscures nothing: the IC number, name, date of
birth and photo are all meant to stay legible, because the recipient still has
to be able to verify the card. The whole design follows from that one
distinction — this tool will not redact, black out, or tile anything, and it is
the reason the band is short and sits in a corner rather than running across the
middle.

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
