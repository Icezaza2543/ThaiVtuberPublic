# VThaiDex — six hand-written logo concepts

Original SVG studies for **VThaiDex**, the independent directory of Thai VTubers. The shared promise is to help small, independent creators be seen; the tone is friendly, playful and trustworthy.

Open [index.html](index.html) directly, or serve this folder locally. It compares every colour and mono mark at **16, 32, 64, 128 and 256 actual CSS pixels** on **#ffffff** and **#120f1f**, with the horizontal lockup on both backgrounds.

## Concepts

### 01 — Open Stage

Two broad beams open around a small spark. A shared stage, with room for the next independent creator.\
Colours: `#7C5CFC`, `#E85D9E`, `#43B7D5`.\
The open V and low stage bar fit the site’s light beams; rounded ends keep the idea welcoming.

### 02 — Pocket Dex

A soft index card with an off-centre tab and a V cut through its face. One clear place to find a creator.\
Colours: `#7C5CFC`, `#43B7D5`.\
The card makes “Dex” tangible, while the broad V stays clear as a favicon and avoids a corporate database look.

### 03 — Lotus Loop

Three broad lotus petals rise from a curved base. A seed-shaped opening gives the centre petal a quiet rhythm.\
Colours: `#7C5CFC`, `#E85D9E`.\
A restrained Thai cue adds local identity; generous petals suggest discovery and growth without ornamental detail.

### 04 — Hello Avatar

An abstract avatar badge with two ear-like tabs and a V smile. It greets visitors without borrowing a character.\
Colours: `#7C5CFC`, `#E85D9E`.\
The face makes a directory feel human; the open interior and single gesture keep it free of anime styling.

### 05 — Voice V

A broad V becomes a microphone cradle. A hollow capsule and short foot complete the sign in three gestures.\
Colours: `#7C5CFC`, `#E85D9E`.\
The name and a creator’s voice meet in one shape; its bold, rounded silhouette feels lively and dependable.

### 06 — Shared Sky

Five equal sparks connect into a V. No central star is larger: discovery belongs to the whole constellation.\
Colours: `#7C5CFC`, `#E85D9E`.\
It echoes the site’s independent-creator universe and gives the brand a useful pattern of equal points.

## Ranking

1. **02 — Pocket Dex.** Best fit for the directory: the tab says “index”, the V ties it to the name, and the large knockout is especially clear at 16 px. The everyday card shape makes it approachable; the tab and cutout give it character.
2. **05 — Voice V.** Strong name recognition and a natural link to creators being heard. Its thick cradle and hollow capsule hold up in mono; the microphone idea is less specific to a directory.
3. **01 — Open Stage.** Closest to the site’s stage-and-light atmosphere, with an open invitation built into the V. The spark is a supporting accent at 16 px, so the beams carry the identity.
4. **03 — Lotus Loop.** The clearest Thai cue, with a warm growth metaphor and a strong petal silhouette. It needs the wordmark to distinguish a creator directory from other lotus-based identities.
5. **06 — Shared Sky.** Best expression of equal visibility: all five sparks have the same size. It makes a useful supporting pattern, although the constellation becomes a simple V at the smallest size.
6. **04 — Hello Avatar.** Most immediately friendly and recognisably virtual, with no borrowed character details. The ear-like outline carries more mascot associations than the other concepts.

## Construction and usage

- All coordinates are hand-written for this brief. No image generator, raster source, tracing, icon library, clip art, copied logo, font outlines or external SVG references were used.
- Symbols use a `0 0 64 64` viewBox. Lockups use `0 0 280 64`: the mark occupies the original 64-unit square, then the name begins at x=80.
- The shared wordmark is custom centreline lettering: eight letter paths plus a separate path for the i dot. It is not Sarabun or Sriracha; its rounded strokes are intended to sit comfortably beside both site fonts.
- Marks use two or three flat colours. Transparent negative space, rather than white paint, makes openings work on both backgrounds. No stroke is narrower than 4 units in a symbol; the wordmark uses 4.4 units.
- Mono uses `currentColor`. Inline it to inherit the surrounding text colour; the preview demonstrates dark ink on white and light ink on dark. An SVG loaded through `<img>` does not inherit the parent’s CSS colour.
- Lockup lettering also uses `currentColor`. Pocket Dex’s coloured tab accent becomes a transparent opening in mono to keep the indexing detail visible.

## File sizes and validation

Exact UTF-8 byte counts, including Thai metadata. Every `mark.svg` is below **3,000 bytes**, the stricter interpretation of the requested 3 KB ceiling. The scoped `.gitattributes` keeps this folder in LF format so byte counts remain stable across checkouts.

| Concept folder | mark.svg (bytes) | mark-mono.svg (bytes) | lockup.svg (bytes) |
|---|---:|---:|---:|
| `01-open-stage` | 803 | 1028 | 1627 |
| `02-pocket-dex` | 746 | 937 | 1570 |
| `03-lotus-loop` | 881 | 1101 | 1705 |
| `04-hello-avatar` | 840 | 1055 | 1664 |
| `05-voice-v` | 964 | 1189 | 1788 |
| `06-shared-sky` | 1039 | 1254 | 1863 |

Run from the repository root:

```powershell
python docs/design/logo-concepts/validate.py
```

The standard-library validator parses all 18 source SVGs and all inline preview SVGs as XML. It checks Thai titles/descriptions, allowed geometry, viewBoxes, byte sizes, paint limits, stroke widths, currentColor mono, path-only lettering, both size ladders, unique preview IDs, local links and this size table.

Visual review on 2026-10-10: inspected all six colour and mono silhouettes and lockups in the browser, including actual 16 px samples on both backgrounds. The preview was checked at 1280 × 720 and 390 × 844: all 66 local SVG images loaded, sample dimensions matched the labels, mono colours inherited correctly, and there was no horizontal page overflow.

These are review concepts. The production mark and site pages are outside this change.
