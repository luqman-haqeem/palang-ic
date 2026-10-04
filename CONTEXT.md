# Context

Glossary for palang-ic. Terms only — no implementation detail, no decisions.
Design decisions live in `docs/superpowers/specs/`.

## Palang

A scope-limiting annotation drawn across a copy of an identity document: two
parallel lines with a declarative sentence between them, stating what the copy
may be used for.

A palang is **not a watermark**. A watermark obscures content to deter reuse; a
palang deliberately obscures nothing and constrains by declaration. The
distinction is load-bearing: the name, IC number, date of birth and photograph
must remain legible, because the recipient must still be able to verify the
card. Any change that starts covering those
fields has stopped building a palang.

The term `watermark` is retired from this project, including in identifiers.

## Scan

An input image of a single card face, supplied by the user. Always an image the
user already has — this project never captures or acquires one.

## Card face

One side of a MyKad: `front` or `back`. The two faces carry different fields in
different positions, so each is annotated independently.

## Copy

The single exported artifact: one A4 page bearing both card faces, each
palanged. The unit the user sends to a recipient. One Copy is produced from one
or two Scans.

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

The angle and text size of the palang, shared by both Card faces — it is one
palang drawn by one hand. Distinct from **Placement**, which is per-face.

## Placement

Where a band sits on its own Card face. Per-face, because the fields that must
stay legible sit differently on the front and the back.

Previously called a **Placement default**; that term covered only the starting
geometry and is retired in favour of naming the thing itself.
