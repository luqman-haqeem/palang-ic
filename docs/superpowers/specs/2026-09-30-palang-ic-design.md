# palang-ic — Design

Date: 2026-09-30
Status: Approved, pending implementation plan

## Purpose

A personal tool that applies a **palang** (see `CONTEXT.md`) to copies of the
author's MyKad before sending them to a bank, telco or agency. It produces one
A4 page bearing both card faces, each annotated with a restrictive sentence
naming the recipient, the purpose and the date.

It exists because the author currently has no way to produce a correctly-worded
palanged copy, and the available hosted service gates exports behind a paid
token quota.

Single user. No accounts, no payments, no quota, no backend.

## Scope

**In scope**

- Load one or two Scans (JPEG, PNG, WebP) of MyKad faces
- Compose a restrictive Malay sentence from Recipient + Purpose + date
- Draw one palang per card face, position adjustable
- Export one A4 Copy as PNG or PDF
- Remember previously used Recipient and Purpose values
- Installable, offline-capable PWA

**Out of scope for v1** (each deferred deliberately, with the reason)

- PDF input — likely needed if the author's scanner outputs PDF; deferred
  because `pdf.js` is ~350 KB spent on a guess. Isolated to the input boundary.
- HEIC input — needs a wasm decoder; only relevant if photographing the card.
- Perspective correction / crop — no phone-photo input in v1.
- Redaction boxes — blacking out fields a recipient needn't see. The most
  likely next feature, and the reason React + Konva were chosen over vanilla
  canvas.
- Multiple palang bands per face. If a face is too busy for one band, the
  answer is moving the band.
- Per-face palang text. A Copy is one document and states one scope.
- Syncing Saved recipients across devices. Would require a backend.
- Field detection to verify the palang misses the IC number. The user eyeballs
  the live preview.

## Decisions and rationale

### The palang follows JPN/MKN guidance, not watermarking convention

Two parallel lines with the purpose written between them; placed to cross the
card while leaving the name, IC number, date of birth and photograph legible.
Fully opaque ink, not semi-transparent — a palang is ink, and transparency
reads as a digital overlay added after the fact, which invites the recipient to
doubt it.

Sources: MKN "Kad Pengenalan: Tips Penjagaan dan Palang Salinan"; JPN "Tips
Palang Salinan Kad Pengenalan" (palang dua garisan lurus, purpose written
between the lines, key fields left unobscured).

### One coordinate system

Everything is expressed in **A4 logical pixels: 794 x 1123** (A4 at 96 dpi).
Placements, angles and font sizes are stored in these units. The preview fits
the stage to the viewport with Konva's stage `scale`, never by altering
coordinates. Export scales up via `pixelRatio`.

Consequence: a placement is resolution-independent and device-independent. The
same stored geometry is correct on phone, laptop and at 300 dpi export.

Note: 794 x 1123 has an aspect ratio of 0.70703 against A4's 0.70707 — a 0.006%
discrepancy, invisible, and absorbed because the PDF places the image at exactly
210 x 297 mm.

### Scans are contain-fitted, never cropped

A Scan is scaled to fit inside its card rect and centred, so an unusual aspect
ratio produces thin white margins rather than a sliced-off edge. Losing part of
the card matters more than a cosmetic gap.

### Scans never reach persistent storage

An invariant, not a preference: Scans live in memory only. Nothing image-shaped
is written to `localStorage`, `IndexedDB` or the service worker cache; the
service worker precaches the app shell and the bundled font only. A reload loses
the session.

The cost is a mild annoyance. The alternative is a forgotten IC scan sitting in
a browser database on a device later sold or repaired, which is the exact harm
this tool exists to prevent. This makes the privacy claim structural rather
than aspirational, and it is covered by a test.

### Fresh scaffold, no convention inheritance

Vite `react-ts` template defaults, Tailwind v4, no component library, no router
(one screen). Existing project conventions were surveyed and deliberately not
adopted at the user's direction.

## Architecture

### Modules

| Module | Responsibility | Depends on |
|---|---|---|
| `domain/page.ts` | A4 and card constants, mm to px, card rect positions | nothing |
| `domain/palang.ts` | Palang model, derived geometry, Placement defaults, sentence template, `fitFontSize` | nothing |
| `domain/filename.ts` | Recipient slugging, export filename | nothing |
| `state/document.ts` | Editing session: Scans, palang text, placements | domain |
| `state/savedRecipients.ts` | `localStorage` read/write for Saved recipients | domain |
| `render/CardSlot.tsx` | Konva image, contain-fitted into a card rect | domain |
| `render/PalangBand.tsx` | Konva group: two lines plus centred text, draggable | domain |
| `render/PageStage.tsx` | A4 stage, white page, card slots, bands, selection layer | render, state |
| `export/renderToDataUrl.ts` | Stage to data URL at export scale; browser only | render |
| `export/buildPdf.ts` | Data URL to A4 single-page PDF | jspdf |
| `ui/*.tsx` | Dropzones, field form, sliders, export buttons | state |

`domain/` imports nothing and knows nothing of React or Konva, which is what
makes the layout maths and the sentence template directly unit-testable. Only
`render/` and `ui/` know React exists.

### Data model

```ts
type CardFace = "front" | "back";

type PalangPlacement = {
  cx: number;        // band centre, page logical px
  cy: number;
  angleDeg: number;  // -45..45
  fontSize: number;  // 8..24 logical px
};

type PalangText = {
  recipient: string;
  purpose: string;
  date: string;      // ISO yyyy-mm-dd
  line: string;      // composed, or hand-edited when detached
  detached: boolean;
};

type SessionState = {
  scans: Partial<Record<CardFace, ImageBitmap>>;   // memory only
  text: PalangText;                                 // shared by both faces
  placements: Record<CardFace, PalangPlacement>;
};
```

## Page layout

Constants expressed in millimetres in `domain/page.ts`, converted with
`MM_TO_PX = 96 / 25.4 = 3.7795`.

- Page: A4, 210 x 297 mm, 794 x 1123 logical px
- Card: 85.6 x 54 mm, 323 x 204 logical px (true MyKad size)
- Top margin: 25 mm (94 px)
- Gap between faces: 15 mm (57 px)
- Cards horizontally centred: x = 235 px

Resulting rects: front at y 94..298, back at y 355..559. Both faces sit in the
upper portion, as on a conventional photocopy.

**One-sided Copy:** if only one Scan is loaded, the page keeps A4 dimensions and
the card stays in the front position. The visibly empty lower half makes it
clear to the recipient that the back was not supplied, rather than looking like
a cropped document. Layout code is identical in both cases.

## Palang rendering

### Derived geometry

Stored: `cx`, `cy`, `angleDeg`, `fontSize`. Everything else derives from
`fontSize`, so proportions stay locked and no thickness control is exposed:

- Line gap: `fontSize * 1.6`
- Stroke width: `fontSize * 0.12`
- Band length: card width x 1.12 (6% overhang each side, reading as a pen
  stroke drawn across the card rather than a pasted graphic)

### Konva structure

The group origin is the band centre, so rotation and drag fall out for free:

```tsx
<Group x={cx} y={cy} rotation={angleDeg} draggable dragBoundFunc={clampToCardRect}>
  <Line points={[-L/2, -g/2, L/2, -g/2]} />
  <Line points={[-L/2,  g/2, L/2,  g/2]} />
  <Text text={line} fontSize={size} offsetX={w/2} offsetY={h/2} />
</Group>
```

### Ink

- Colour `#9B1C1C`, fully opaque, for both lines and text
- ALL CAPS, matching every JPN example
- Font: Roboto Condensed Bold, bundled and self-hosted as a subsetted woff2
  (Latin, digits, punctuation)

A bundled font makes output deterministic across devices and keeps the PWA
fully offline. Condensed is a practical choice, not aesthetic: a narrower
typeface fits a longer purpose phrase into a thinner band, and a thin band is
easier to place clear of a field.

**Font loading is a gate.** The app awaits
`document.fonts.load('bold 16px "Roboto Condensed"')` before mounting the
stage. Measuring before the font loads yields fallback metrics and a
mis-sized band — a failure that hides on a warm desktop cache and appears on a
cold phone load.

### Placement defaults

Per face, in page logical px:

| Face | cx | cy | angleDeg | fontSize |
|---|---|---|---|---|
| front | 396 | 241 | -12 | 14 |
| back | 396 | 502 | -12 | 14 |

`cx` is the horizontal page centre; `cy` sits at ~72% of the card's height,
placing the band across the lower third. The lower portion holds the address
block, the field least
likely to need to stay legible, while name, IC number and photograph cluster
toward the top and right.

This constant is to be verified against a real scan during implementation and
adjusted. It is one line in `domain/palang.ts`, and last-used placement is
remembered, so the default is a starting point only.

### Text fitting

```ts
fitFontSize(line, maxWidth, startSize, floor, measure: (t, s) => number): number
```

Shrinks from `startSize` until the text fits the band length, with a floor of
6 px, after which it overflows. The measurer is injected: real code passes a
canvas-backed one, tests pass a fake, so the fit logic is unit-tested without a
canvas.

Auto-shrink rather than wrapping: a thick two-line band is much harder to place
without covering a field, which is the reason the template is one line.

## Palang text

Template:

```
UNTUK URUSAN {PURPOSE} {RECIPIENT} SAHAJA — {DD/MM/YYYY}
```

Composed uppercase, one line, date inline. The date is the day the Copy was
produced — this is what makes `SAHAJA` meaningful in practice, since a
recipient can see the copy predates any later misuse.

One sentence, shared by both faces. A palang states the scope of the Copy, and
the Copy is one document; two faces bearing different purpose statements would
be incoherent.

### Edit and recompose

The composed line is editable. The first manual edit sets `detached: true`,
after which field changes no longer overwrite it. A visible "Reset to template"
button clears the flag and recomposes.

Silently discarding a deliberate edit when a field changes was rejected:
detaching makes the two modes honest about which is driving the text.

## Interaction

- **Drag** a band to move it. `dragBoundFunc` clamps the band *centre* to its
  own card rect — this prevents a band floating in the page margin marking
  nothing, while still permitting the overhang, since the line ends are
  unconstrained.
- **Angle** slider, -45 to +45 degrees, 1 degree steps. Beyond that range the
  text fights the card's landscape shape.
- **Text size** slider, 8 to 24 logical px.
- **Arrow keys** nudge the selected band by 1 px, shift for 10. This is the
  difference between "close enough" and "exactly clear of the IC number", which
  is the tool's one real precision requirement.
- **Reset placement** per face.
- Each dropzone shows a thumbnail with a remove control, so a badly scanned
  back does not cost the front's placement.
- **Clear all** empties the session on demand.
- Selection state is UI-only and renders into a **separate Konva layer**, so it
  can be hidden during export.

UI language is English; output is Malay.

## Input handling

1. Validate extension and MIME against JPEG, PNG, WebP. Anything else is
   rejected with a specific message naming the accepted formats — notably, a
   PDF from a scanner must be told to export as JPEG.
2. Decode with `createImageBitmap`.
3. If the longest edge exceeds 2000 px, downscale through an offscreen canvas.

The downscale is unconditional and lossless in practice: a card renders into a
323 x 204 logical box, which at 300 dpi export is ~1011 x 638 real pixels, so
source detail beyond ~2000 px is discarded regardless. It removes a whole
failure class — two 600 dpi scans plus a 2481 x 3509 export canvas is enough for
mobile Safari to drop the canvas and return a blank image, which presents as
"the app is broken".

## Export

Hide the selection layer, render, restore it.

```ts
// PNG, 2481 x 3509
stage.toDataURL({ pixelRatio: 300 / 96, mimeType: "image/png" })

// PDF, A4 single page
const jpeg = stage.toDataURL({ pixelRatio: 300 / 96, mimeType: "image/jpeg", quality: 0.92 });
new jsPDF({ unit: "mm", format: "a4" }).addImage(jpeg, "JPEG", 0, 0, 210, 297);
```

300 dpi for both. JPEG compression inside the PDF keeps it comfortably under a
megabyte while retaining print quality; the PNG path is the uncompressed option
and its size is accepted.

Filename: `salinan-{recipient-slug}-{YYYY-MM-DD}.{png|pdf}`, so the downloads
folder self-sorts and each Copy's recipient is visible at a glance.

Both Scans stay loaded after export, allowing a second format or an adjustment
without reloading.

## Saved recipients

Recipient and Purpose are text inputs backed by a native `datalist` offering
the last 10 values each, most recent first, deduplicated case-insensitively,
with a control to delete an entry. Delete matters: a typo saved once would
otherwise persist indefinitely.

Stored in `localStorage` — the only thing that is. Per-device by consequence:
installing on phone and laptop yields two independent lists.

## Error handling

| Condition | Behaviour |
|---|---|
| Unsupported file type | Inline message naming accepted formats |
| Decode failure on a valid extension | Inline message, dropzone stays empty |
| PDF export throws | Inline message, session preserved |
| No Scan loaded | Export buttons disabled |
| Recipient or Purpose empty | Export buttons disabled |

The empty-field guard is the one worth engineering against. A Copy reading
`UNTUK URUSAN  SAHAJA` is **worse than no palang at all**: it looks marked while
granting no scope limitation, and the user would plausibly not notice before
sending it.

## Testing

Vitest with jsdom. Unit tests cover:

- Page layout maths, mm conversion, card rect positions
- The sentence template
- `fitFontSize` with a fake measurer
- Filename slugging
- Saved recipients store: add, dedupe, cap at 10, delete
- The detach and reset-to-template logic
- `buildPdf` produces an A4-sized, non-trivial PDF from a stub data URL
- **The persistence invariant:** after loading a Scan, `localStorage` holds no
  key but the saved-recipients key, and no stored value contains image data

Canvas rendering is verified by eye against a real scan. Export is split into
`renderToDataUrl` (browser only, needs a real canvas) and `buildPdf` (testable
in jsdom) specifically so the export smoke test can exist without pulling in
the native `canvas` package. Visual regression was rejected as disproportionate
maintenance for a two-object scene.

## Deployment

Cloudflare **Workers with a static assets binding**, `wrangler.jsonc`, wrangler
in devDependencies, deployed by hand with `npx wrangler deploy`. Served from a
`*.workers.dev` subdomain. No gating, no CI.

Workers over Pages on direction of travel, not capability: for a purely static
SPA the two are functionally equivalent and static asset requests are free on
both, but Pages receives no further feature investment. The one Pages advantage
forgone is custom domains whose DNS is not on Cloudflare.

Wrangler has no persistent login on this machine, so the user must run
`npx wrangler login` before the first deploy.

The privacy story is unaffected by hosting: Cloudflare serves the HTML, JS, CSS
and font, and never sees a Scan.

PWA via `vite-plugin-pwa`, `registerType: "autoUpdate"`, name `palang-ic`, theme
colour `#9B1C1C`, generated card-with-band icon at 192 and 512 px. Precache
covers the app shell and font only, never runtime image data.

## Risks

- **Placement defaults are guessed.** MyKad field positions were reasoned from
  memory, not measured. Requires verification against a real scan; the fix is a
  constant.
- **Scanner output format.** If the author's scanner emits PDF, v1 cannot accept
  its output at all and PDF input becomes immediately necessary.
- **Recipient acceptance is untested.** Whether a bank accepts a digitally
  palanged copy as readily as a handwritten one is unknown until tried.

---

## Revision — 2026-10-01, after first real use

The first session with the deployed tool produced two pieces of feedback that
simplify the design. Both supersede decisions above; the original reasoning is
left in place so the trade-off that was accepted stays visible.

### Angle and text size are shared by both faces

Supersedes the per-face `PalangPlacement` carrying `angleDeg` and `fontSize`.
A palang is one annotation drawn by one hand; two faces at different angles
looks like two separate acts. Position stays per-face, because the fields that
must remain legible sit differently on each side.

`PalangPlacement` is now `{ cx, cy }` and a single session-level `BandStyle`
holds `{ angleDeg, fontSize }`. The UI has one Band control group plus a
per-face "reset position".

### One free-text field, no template, no auto-date

Supersedes the structured Recipient + Purpose fields, the
`UNTUK URUSAN … SAHAJA` template, the auto-appended date, and the whole
detach / "Reset to template" mechanism.

The user types the palang text and it is drawn verbatim. Whether to name a
recipient, state a purpose, include a date, or none of those, is the user's
decision.

**What this gives up, stated plainly:** the original design used structured
fields specifically so the tool could guarantee a correctly-worded restrictive
sentence, on the reasoning that a malformed palang "looks marked while granting
no scope limitation". That guarantee is gone. The only remaining guard is that
the text cannot be blank — `canExport` still refuses two red lines with nothing
between them. Wording correctness is now the user's responsibility, which is
the trade they asked for.

Text renders as typed rather than forced to upper case: the user owns the
wording, so the tool should not silently rewrite it.

**The field is seeded with a prefix**, `PALANG_PREFIX = "UNTUK URUSAN "`, as a
starting point rather than a format. The user's reason for rejecting a fixed
template is the operative one: different banks and agencies want the wording set
out differently, so hardcoding one format makes the tool harder to use, not
safer.

Because the field is seeded, the blank-text guard has to be tighter than
`!== ""`: the prefix on its own states nothing, so `canExport` treats
prefix-only text as empty. Wording that does not use the prefix at all is
accepted, since the prefix is a nudge and not a rule. Focusing a field that
holds only the prefix puts the caret after it.

### Export filename is generic

`salinan-{YYYY-MM-DD}.{png|pdf}`, carrying nothing from the palang text.
Supersedes the recipient slug, and `slugRecipient` is deleted along with it.

This is better than the original: the palang text is now free-form and may name
a bank or a loan, and a filename is the one part of a Copy that shows up in a
downloads list or an email attachment line before anyone opens it.

The date is still tracked in session state, solely for this filename, and is
still refreshed on tab focus so an installed PWA left open across midnight does
not stamp yesterday.

### Vocabulary

`CONTEXT.md` retires **Recipient**, **Purpose**, **Saved recipient** and
**Placement default**, and adds **Palang text**, **Saved line**, **Band style**
and **Placement**.

### Band form and defaults, tuned against a real card — 2026-10-01

The band is no longer a full-width horizontal stroke. It is a **corner palang**:
a shorter stroke across the top-left of the card, at a steep angle.

Defaults, measured by the user with the in-app sliders rather than guessed:

| Setting | Value |
|---|---|
| `angleDeg` | −45 |
| `lengthFactor` | 0.55 (of card width) |
| `fontSize` | 13 |
| centre offset within card | 34px right, 40px down (`BAND_X_FRACTION` 0.105, `BAND_Y_FRACTION` 0.196) |

This supersedes the original "band across the lower third at −12°, overhanging
both edges", and with it the spec's top risk — the placement constant is now
measured, not reasoned from memory.

**The band deliberately runs off the top-left corner** at these values. That is
intended: a palang is a stroke drawn across a copy, not a graphic fitted inside
it. The test that asserted the whole band stayed within the card has been
replaced by one asserting the overhang and that only the *centre* is clamped.

`lengthFactor` is now part of `BandStyle` and adjustable, 0.25–1.2. At 1.2 the
old full-width-with-overhang look is still reachable, so the corner form is a
default rather than a constraint.

The user's front and back offsets differed by 1px (40 and 39). Normalised to a
single shared offset, on the grounds that 1px at 96dpi is 0.26mm and is slider
noise rather than intent. Per-face positions remain independently adjustable.

### Controls live under "Advanced settings"

The angle, length, text-size and per-face position sliders, plus the values
readout, are collapsed behind a disclosure. The defaults are tuned, so a normal
use is: drop two scans, check the text, export. The sliders exist for the copy a
recipient wants marked differently — and existed in the first place because
dragging a small band with a thumb on a phone is fiddly.

### A build ID is shown in the readout

`vite.config.ts` injects `__BUILD_ID__` (month-day hour:minute) and the readout
prints it. During iteration a redeploy to the same URL can be masked by the
service worker's precache, which cost a test window: the symptom is an apparently
unchanged app. A visible build ID makes staleness diagnosable rather than
mysterious.

### Ink is black by default and configurable — 2026-10-01

Supersedes the fixed `INK = "#9B1C1C"` and the reasoning behind it ("dark red so
it is unmistakably an annotation and not part of the card"). Verified against a
real card: black reads correctly as ink on a photocopy, and the original
argument for red was aesthetic rather than practical.

`ink` is now part of `BandStyle`, set with a colour picker plus black / dark red
/ navy presets under Advanced settings. Values pass through `normaliseInk`,
which accepts `#rgb` or `#rrggbb` and falls back to black for anything else — an
invalid colour would otherwise draw an invisible band, which is the worst
possible failure for this tool. The readout reports the ink so a tuned colour
can be baked in like the other defaults.

Still red: the PWA theme colour and the app icon, both chosen to match the old
ink. Left alone deliberately rather than churned.

### Export verified against a real card

The user confirmed a one-sided Copy exports with **no dashed placeholder box** in
the empty slot. That was the review finding (I3) fixed by reasoning alone, with
no automated test possible — jsdom has no canvas. It is now confirmed in a real
browser.

### Colour swatches and opacity — 2026-10-01

The ink presets render as **colour swatches** rather than coloured text labels,
with the active one ringed. A swatch shows the colour; a label describes it, and
for three colours the description was doing no work. Each carries a `title` and
`aria-label` so the name is still available.

**Opacity is adjustable**, 0.15–1, defaulting to **1**. The default remains fully
opaque for the reason the original design gave — a palang is ink, and
transparency reads as a digital overlay added after the fact, which invites the
recipient to doubt it. But a faded band is sometimes wanted where the underlying
print must stay readable through the mark, so the control exists.

The floor is 0.15 rather than 0, deliberately: a fully transparent band renders a
Copy that looks unmarked while the user believes it is marked, which is the same
failure class as blank text. Reaching it must be impossible, not merely
unlikely.

Applied as Konva `opacity` on the band group, so the two lines and the text fade
together rather than drifting apart. The readout reports it.

### Scans are clipped to rounded corners — 2026-10-02

A MyKad has rounded corners. A square-cornered scan on a white A4 page reads as
a screenshot rather than a copy of a card, which undercuts the document.

The radius comes from the same standard as the card size: **ISO/IEC 7810 ID-1,
3.18mm**, which is 12 logical px at 96dpi. Not an arbitrary design value — the
card geometry was already being taken from that standard for 85.6 x 54mm, so
taking the radius from it too keeps one source of truth.

Applied as a Konva `clipFunc` on a group wrapping the image, **clipped to the
fitted image rect rather than the card slot**. The distinction matters: a scan
whose aspect ratio differs from the card gets letterboxed inside the slot, and
clipping the slot would round the slot's corners while leaving the image's own
corners square inside it.

`clampCornerRadius` caps the radius at half the shorter side. A larger radius
inverts the rounded-rect path and renders nothing — worth guarding since the
radius is applied to a fitted rect whose size depends on the scan.

The empty-slot placeholder is rounded too, via `Rect`'s own `cornerRadius`, so
the preview shows the card shape before anything is loaded.

Path drawn with `arcTo` rather than `roundRect`, which older Safari lacks — and
Safari is the likely browser for a phone-installed PWA.
