# Context

Glossary for palang-ic. Terms only — no implementation detail, no decisions.
Design decisions live in `docs/superpowers/specs/`.

## Palang

A scope-limiting annotation drawn across a copy of a Document: two parallel
lines with a declarative sentence between them, stating what the copy may be
used for.

A palang is **not a watermark**. A watermark obscures content to deter reuse; a
palang deliberately obscures nothing and constrains by declaration. The
distinction is load-bearing: the fields the recipient needs to verify the
Document must remain legible. On a MyKad those are the name, IC number, date of
birth and photograph. Any change that starts covering those fields has stopped
building a palang.

A palang is never cut by the edge of the Copy. It may run off a card onto the
sheet around it, but never off the sheet.

The term `watermark` is retired from this project, including in identifiers.

## Document

What the user is making a Copy of. Every Document is one of two
**Document kinds**:

- **MyKad**: the identity card, as one or two Card faces.
- **Page**: any single-sided paper document, such as a surat beranak or a
  sijil SPM, as one page. The tool knows nothing about what is printed on it.

The Document kind is the user's choice; it is never guessed from a Scan.

## Scan

An input image of a single Card face or Page, supplied by the user. Always an image the
user already has — this project never captures or acquires one.

## Crop

The rotation (in quarter turns) and the area of a Scan that fills its box on
the Copy. Per Card face or Page, and stored beside the Scan rather than baked
into it, so it can be re-edited or reset and the original is never lost. A new
Scan for the same face or Page starts without one.

A Crop always has its Document's shape: the card's shape on a MyKad, A4
proportions on a Page. On a Page the Crop also has its own orientation,
portrait or landscape, chosen by the user and independent of its quarter
turns: turning the Scan never turns the Crop. Straightening a tilted photo is
not part of it: a Crop only turns in quarter turns.

## Card face

One side of a MyKad: `front` or `back`. The two faces carry different fields in
different positions, so each is annotated independently.

## Copy

The single exported artifact: one Sheet bearing one Document, palanged. The
unit the user sends to a recipient. A Copy never mixes Documents.

For a MyKad, the Copy is a portrait Sheet bearing both Card faces, produced from
one or two Scans. For a Page, the Page fills the Sheet, and the Sheet takes
the Page's orientation, its Crop's once it has one; a second page of the same paper is a second
Copy.

## Sheet

The A4 sheet a Copy is printed on, portrait or landscape. Not the same as a
Page: a Page is a Document kind, the paper being copied; the Sheet is what the
Copy is printed on.

## Palang text

The sentence the user writes, drawn verbatim between the two lines. The tool
imposes no template and appends no date: whether to name a recipient, a purpose,
a date, or none of them is the user's decision.

Previously this was composed by the tool from separate **Recipient** and
**Purpose** inputs. Both terms are retired, along with the idea of a canonical
template the tool enforces.

## Saved line

A Palang text remembered from previous use and offered back for reuse. Replaces
the retired **Saved recipient**.

## Band style

The angle and text size of the palang, shared by both Card faces and kept when
the user switches Document kind: it is one palang drawn by one hand. Its size is
relative to the Document it marks. Distinct from **Placement**, which is per
Card face or Page.

## Placement

Where a band sits on its own Card face or Page. Per-face on a MyKad, because
the fields that must stay legible sit differently on the front and the back.

Previously called a **Placement default**; that term covered only the starting
geometry and is retired in favour of naming the thing itself.
