## Goal
After a user uploads a new item, surface a **dedicated visual preview card** for each suggested outfit that places the **newly added item** next to its matching wardrobe pieces, with a short, focused **color-theory explanation** (complementary / analogous / neutral anchor / monochrome / triadic, etc.) — styled in the LCARS Picard aesthetic.

This complements the existing Board / Compare tabs in `OutfitSuggestionDrawer` rather than replacing them.

## What changes

### 1. New component: `src/components/wardrobe/NewItemMatchCard.tsx`
A compact, scannable "spotlight" card with three regions:

- **Left tile — "JUST ADDED"** (lavender LCARS endcap)
  - Large image of the newly uploaded item with a glowing teal border + "NEW INTAKE" pill
  - Color swatch chip showing `color_hex` + color name
- **Connector** — animated `→` arrow with a tiny LCARS chip ("MATCH 87%" style, derived locally) and a color-relationship label (e.g. `COMPLEMENTARY`, `ANALOGOUS`, `NEUTRAL ANCHOR`)
- **Right tile — "MATCHING PIECES"** (orange LCARS endcap)
  - Horizontal strip of the *other* outfit items (excluding the new item), each with their own color swatch
- **Bottom strip — "COLOR THEORY"**
  - Two lines:
    1. The relationship label + a one-sentence rule of thumb (generated from a local helper, see §3)
    2. The AI's existing `outfit.explanation` (already returned by `match-outfit`), prefixed with a small lavender code chip
  - Mini palette row: 4–6 swatch dots showing the dominant hex of every piece in the outfit, in the order top → bottom of the body

All copy uppercase tracking-widest where appropriate; uses `LcarsPill`, `LcarsCodeChip`, `lcarsCode()` from `LcarsPrimitives.tsx`.

### 2. Wire the new card into `OutfitSuggestionDrawer.tsx`
- Add a new prop `newlyAddedItemId?: string` to `OutfitSuggestionDrawer`.
- When set, render `NewItemMatchCard` **above** the existing Tabs (Board / Compare) for each outfit that contains that item ID. (No card if the outfit doesn't include the new item.)
- The existing Board/Compare tabs stay intact — the new card is the at-a-glance hero.
- In `AddItem.tsx` (the existing post-save flow that already opens the drawer with `newlyAddedItem`), pass `newlyAddedItemId={newlyAddedItem.id}`.

### 3. New helper: `src/lib/color-theory.ts`
A pure, dependency-free helper used by the new card:

```ts
export type ColorRelationship =
  | "monochrome" | "analogous" | "complementary"
  | "triadic" | "neutral-anchor" | "tonal-contrast";

export function describeOutfitPalette(hexes: string[]): {
  relationship: ColorRelationship;
  label: string;        // e.g. "COMPLEMENTARY"
  rationale: string;    // one-sentence rule of thumb
  dominantHexes: string[]; // deduped, ordered
};
```

Logic:
- Convert each hex → HSL.
- Treat S < 12% or L < 12% / > 88% as **neutral**. If the outfit has ≥1 neutral + ≥1 chromatic → `neutral-anchor`.
- All hues within ~20° → `monochrome` (if also similar L) or `analogous`.
- Two clusters ~180° apart → `complementary`.
- Three clusters ~120° apart → `triadic`.
- Same hue, very different L → `tonal-contrast`.
- Each branch returns a short, plain-English rationale (e.g. *"Opposite hues on the wheel — they make each other pop without clashing."*).

This means the color-theory blurb is **deterministic and instant**, even before the AI explanation renders, and works offline.

### 4. Light styling additions in `src/index.css`
- `.new-intake-glow` — soft teal box-shadow + animated subtle pulse for the JUST ADDED tile border.
- `.color-swatch-dot` — 14px round chip with 1px frost ring used in the mini palette row.

No Tailwind config or token changes — reuses existing `lcars-*` and `titan-*` tokens.

### 5. Touch points (small)
- `src/pages/AddItem.tsx` — pass new prop when opening the drawer (1 line).
- `src/components/wardrobe/OutfitSuggestionDrawer.tsx` — accept new prop, render `NewItemMatchCard` above tabs when applicable (~10 lines).
- No edge-function changes; existing `outfit.explanation` from `match-outfit` is reused as the AI commentary line.

## Files
**Create**
- `src/components/wardrobe/NewItemMatchCard.tsx`
- `src/lib/color-theory.ts`

**Edit**
- `src/components/wardrobe/OutfitSuggestionDrawer.tsx` (add prop + render hero card)
- `src/pages/AddItem.tsx` (pass `newlyAddedItemId`)
- `src/index.css` (two small utility classes)

## Out of scope
- No changes to `match-outfit` edge function.
- No DB migrations.
- No changes to the Outfits page (this is specifically the **post-upload** experience — the user said "newly uploaded item").
