# Context

Glossary for palang-ic. Terms only — no implementation detail, no decisions.
Design decisions live in `docs/superpowers/specs/`.

## Palang

A scope-limiting annotation drawn across a copy of an identity document: two
parallel lines with a declarative sentence between them, stating what the copy
may be used for.

A palang is **not a watermark**. A watermark obscures content to deter reuse; a
palang deliberately obscures nothing and constrains by declaration. The
distinction is load-bearing: the JPN and MKN guidance requires that the name,
IC number, date of birth and photograph remain legible, because the recipient
must still be able to verify the card. Any change that starts covering those
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

## Recipient

The party the Copy is being given to — a bank, a telco, a school. Named inside
the palang sentence.

## Purpose

The transaction the Copy is being supplied for — a personal loan, a
registration. Composes with the Recipient into a single restrictive phrase; the
two are separate inputs but never separate sentences.

## Saved recipient

A Recipient or Purpose value remembered from previous use and offered back as a
suggestion. Distinct from a Placement default.

## Placement default

The starting geometry of a palang on a card face, before the user adjusts it.
Distinct from a Saved recipient.

Both were previously called "preset". That term is retired as ambiguous.
