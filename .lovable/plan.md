# Adaptive Style Learning

A lightweight per-user preference model derived from real interactions. It biases every suggestion surface toward what you favorite/save/inspect and away from what you dismiss — without retraining anything.

---

## 1. Capture signals (DB)

New table `style_signals` (RLS, owner-only insert/select/delete):

```
id uuid pk
user_id uuid not null
signal_type text not null check (signal_type in ('favorite','save','dismiss','view'))
weight smallint not null   -- favorite=+2, save=+1, view=+1, dismiss=-2
item_ids text[] not null default '{}'  -- the wardrobe items in the suggestion
mood text
color_hexes text[] default '{}'        -- snapshot of dominant hexes
style_tags text[] default '{}'         -- union of tags
created_at timestamptz default now()
```

Indexes on `(user_id, created_at desc)` and a partial index on `signal_type`.

A second table `dismissed_outfits` (small, just `user_id` + `outfit_signature` text + `created_at`) suppresses a previously-dismissed AI-returned outfit if it shows up again in the same session — by exact item-id signature.

No schema change to `saved_outfits` (already has `is_favorite`).

---

## 2. Logging hooks (client)

A single helper `src/lib/style-signals.ts` exporting `recordSignal(type, payload)`. Calls fire-and-forget (no toast on failure, console.warn only).

Surfaces that emit:

| Action | Signal | Where |
|---|---|---|
| Heart "Save + Favorite" | `favorite` (+2) | OutfitSuggestionDrawer, OccasionOutfitDrawer, CompleteLookView |
| Plain Bookmark "Save" | `save` (+1) | same three components |
| New 👎 Thumbs-down button | `dismiss` (−2) | same three components — also hides that suggestion locally and inserts into `dismissed_outfits` |
| Tap a suggested item card to inspect | `view` (+1) | ScanMatchRail, OutfitPreviewBoard (debounced, max one view per item per minute on the client to prevent spam) |
| Toggle ❤ on already-saved Outfits page | `favorite` (+2) on toggle-on, `dismiss` (−2) on toggle-off | Outfits.tsx `toggleFavorite` |

Each signal records the snapshot of color hexes + tags so the model is robust even if items are later deleted.

---

## 3. Build the preference profile (client, cached)

New hook `src/hooks/useStylePreferences.ts`:

- React-Query keyed `["style-signals", userId]`, 10-min stale time.
- Fetches the last 200 signals, weighted by recency (half-life ~30 days: `recencyMul = 0.5 ^ (daysOld / 30)`).
- Aggregates into a `PreferenceProfile`:
  - `colorWeights: Map<bucketedHex, number>` — hexes bucketed to nearest of 24 hue buckets × 3 lightness tiers.
  - `tagWeights: Map<string, number>` — case-folded tag → weight.
  - `moodWeights: Map<string, number>`.
  - `itemWeights: Map<itemId, number>` — direct per-item bias.
  - `dismissedSignatures: Set<string>` (item-id sorted concat).
- Exposes `scoreItemBoost(item) → number in [-15, +15]` and `scoreOutfitBoost({ items, mood }) → number in [-25, +25]`.

Boosts are clamped so the learned model can never fully override hard formality rules.

---

## 4. Apply boosts everywhere

**a) Shop instant matches — `src/lib/catalog-match.ts`**
- `scoreCatalogMatches(scanned, catalog, prefs?)` adds an optional 5th component:
  ```
  total = color + style + formality + patternTexture + clamp(prefs.scoreItemBoost(candidate), -15, +15)
  ```
- Re-sort & re-cut by `MIN_SCORE`. Items the user has favorited frequently will rise; tags they dismiss drop.
- `Shop.tsx` reads the prefs hook and passes it into `useMemo`.

**b) AI drawers — `OutfitSuggestionDrawer` & `OccasionOutfitDrawer`**
- After receiving `outfits` from `match-outfit`/`suggest-occasion-outfit`, run `outfits = rerankOutfits(outfits, prefs, allWardrobeItems)` which:
  1. Filters out any whose item-id signature is in `dismissedSignatures`.
  2. Sorts by `aiOrder + scoreOutfitBoost(...) * 0.5` (small nudge — keeps AI ordering as the spine).
- No edge-function changes needed for v1 (purely client rerank). Edge functions stay deterministic and cacheable.

**c) Inspire flow — `Outfits.tsx`**
- Same `rerankOutfits` applied to `inspireOutfits` before they're handed to the drawer.

---

## 5. Dismiss UI (👎 button)

Three components get a third button next to Heart/Bookmark:

- Icon: `ThumbsDown` from lucide.
- Tooltip: "Not for me — show less like this".
- Click flow:
  1. Insert `dismiss` signal with snapshot.
  2. Insert into `dismissed_outfits` with the item-id signature.
  3. Locally remove the suggestion from the list (slide-out animation via existing tailwind classes).
  4. Toast: "Got it — we'll show fewer like this."
- Disabled once the outfit was saved/favorited (you can't both like and dismiss).

---

## 6. Profile page transparency

Add a small **"Style Preferences (Learned)"** card on `Profile.tsx` showing:

- Top 5 boosted style tags + hue chips (so the user sees what the system is picking up).
- A "Reset learning" button → deletes their `style_signals` rows after a confirm dialog. Same destructive style as existing "Clear all data".

Purely informational — keeps users in control and satisfies the GDPR transparency principle already in place.

---

## 7. Files

**New**
- `supabase/migrations/<ts>_style_signals.sql` — `style_signals` + `dismissed_outfits` tables, RLS, indexes.
- `src/lib/style-signals.ts` — `recordSignal`, `signatureFor`.
- `src/lib/preference-profile.ts` — `buildProfile`, `scoreItemBoost`, `scoreOutfitBoost`, `rerankOutfits`, hue bucketing.
- `src/hooks/useStylePreferences.ts` — React-Query hook returning the profile + helpers.

**Edited**
- `src/lib/catalog-match.ts` — accept optional `prefs` and add boost component.
- `src/pages/Shop.tsx` — pass prefs into `scoreCatalogMatches`; emit `view` signal on item click.
- `src/components/wardrobe/ScanMatchRail.tsx` — emit `view` on click (already has `onItemClick`).
- `src/components/wardrobe/OutfitSuggestionDrawer.tsx` — rerank, add 👎 button, log signals on save/favorite/dismiss.
- `src/components/wardrobe/OccasionOutfitDrawer.tsx` — same three additions.
- `src/components/wardrobe/CompleteLookView.tsx` — log on save/favorite, add 👎 button.
- `src/pages/Outfits.tsx` — rerank `inspireOutfits`; emit favorite/dismiss in `toggleFavorite` mutation.
- `src/pages/Profile.tsx` — add "Learned Preferences" card + reset button.

No changes to edge functions, no new secrets, no extra AI cost. All scoring is local.

---

## 8. Verification

- `tsc --noEmit` clean.
- Manual: favorite an outfit with navy + minimalist tags → reopen Shop, scan a navy shirt → favorited navy items should rank above newer additions.
- Dismiss a suggestion → reopen drawer in same session → it stays out. Reload → it can return (only the per-suggestion signature is suppressed in-session via `dismissed_outfits`; long-term effect comes from the weighted aggregate).
- Reset button on Profile clears signals and the next reload returns to neutral ranking.