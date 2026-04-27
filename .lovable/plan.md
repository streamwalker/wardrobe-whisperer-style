# Scan Upload Flow → Instant Top Matches (Shoes / Pants / Shirts)

## Goal
On the Shop page, after photo upload + AI analysis, immediately surface the **top matched items from the user's own catalog** in each of the three target categories — **Shoes, Pants, Shirts (tops)** — *before* (and alongside) the slower full-outfit AI matcher.

This is a fast, deterministic local scoring pass that runs the moment `analyze-clothing` returns, so the user sees relevant pieces of their wardrobe in roughly one frame.

## UX Flow (Shop page)

1. User snaps / uploads a shopping photo (existing UI).
2. `analyze-clothing` returns `{ name, category, primary_color, color_hex, style_tags, pattern, texture }` (already implemented).
3. **NEW** — Immediately run a local `scoreCatalogMatches()` pass over `wardrobeItems` and render a **"TOP MATCHES IN YOUR CATALOG"** LCARS panel with three rails:
   - 👟 SHOES — top 3 (combines `shoes` + `dress-shoes`)
   - 👖 PANTS — top 3
   - 👕 SHIRTS — top 3 (`tops`)
   Each rail shows match % chip, color swatch, item name. Tapping a card opens the existing zoomable view.
4. Below the rails, the existing **"Find Wardrobe Matches"** button is still available for the slower full-outfit AI suggestions — this becomes optional / secondary.
5. If a category has zero items, that rail shows an empty LCARS hint ("NO PANTS IN CATALOG").

## Scoring (deterministic, runs in browser, ~instant)

New file `src/lib/catalog-match.ts` — pure function:

```ts
scoreCatalogMatches(scanned: AnalyzedItem, catalog: WardrobeItem[]) →
  { shoes: ScoredItem[]; pants: ScoredItem[]; shirts: ScoredItem[] }
```

Score (0–100) per candidate:
- **Color harmony (50 pts)** — reuse `describeOutfitPalette([scanned.hex, candidate.hex])`:
  - complementary / analogous / neutral-anchor / monochrome → 50
  - triadic → 40
  - tonal-contrast → 35
  - else → 20
- **Style tag overlap (25 pts)** — `25 * intersection / union` of `style_tags`.
- **Formality compatibility (15 pts)** — penalize hard mismatches (e.g. scanned hoodie vs `dress-shoes`, scanned suit vs casual `shoes`); use the same dress-shirt / suit / hoodie rules already encoded in `supabase/functions/_shared/dress-shirt-rules.ts` (lift the rule constants into a shared client-safe helper).
- **Pattern/texture bonus (10 pts)** — bonus when patterns differ in scale (≤1 patterned item per pair) and textures contrast.

Sort each category descending by score, take top 3 with score ≥ 35 (anything lower is hidden so we don't show garbage matches).

## Deliverables

**New files**
- `src/lib/catalog-match.ts` — scoring + per-category top-N selector.
- `src/components/wardrobe/ScanMatchRail.tsx` — LCARS rail (label chip, 3 cards, empty state).
- `src/components/wardrobe/ScanMatchPanel.tsx` — wraps three rails with the "TOP MATCHES" header, scanned-item swatch, and overall best-relationship label from `describeOutfitPalette`.

**Edited files**
- `src/pages/Shop.tsx`:
  - After analyze succeeds, compute matches synchronously via `scoreCatalogMatches` and render `<ScanMatchPanel/>` immediately.
  - Keep existing "Save to Wardrobe" + "Find Wardrobe Matches" CTAs below.
  - Demote outfit suggestions: only render when explicitly requested.
- `src/index.css` — small additions for `.scan-match-card` (subtle teal accent + match-percentage chip).
- `supabase/functions/_shared/dress-shirt-rules.ts` (or a new `src/lib/style-rules.ts`) — extract the formality matrix as plain constants importable from the client. *No edge function logic changes; we just reuse the data.*

## Out of Scope (intentionally)
- No new edge function — scoring is fully local and deterministic, which is what makes it "instant."
- No DB schema changes.
- No changes to the AI outfit matcher (`match-outfit`) — it still powers the full-look suggestions when the user opts in.
- Pro gating stays as-is on Shop.

## Open Questions for the User
1. Should the legacy AI "Find Wardrobe Matches" button stay visible as a secondary action, or be removed entirely now that instant matches exist?
2. Top-N size — keep it at **3 per category**, or expose a "see more" expand to show up to 6?
