## Goal
In every outfit suggestion surface, expose a **Heart** action that saves the suggested look to `saved_outfits` **and** marks `is_favorite = true` in a single tap. The existing **Bookmark** button stays as the "save without favoriting" path, so the user gets a clean two-button affordance everywhere a suggestion is shown.

Saved-state remains session-only per the user's choice — closing/reopening a drawer resets the visual saved indicator (no extra `saved_outfits` query on open).

## Surfaces touched
All four currently render outfit suggestions; all four get the same control pair.

| Surface | File | Currently has | Add |
|---|---|---|---|
| Wardrobe → "Outfit Ideas" drawer | `src/components/wardrobe/OutfitSuggestionDrawer.tsx` | Bookmark only | Heart (save + favorite) |
| Outfits → "Recreate a Look" drawer | reuses `OutfitSuggestionDrawer.tsx` (`prefetchedOutfits`) | Bookmark only | Heart (save + favorite) |
| Occasion drawer | `src/components/wardrobe/OccasionOutfitDrawer.tsx` | Bookmark only | Heart (save + favorite) |
| Complete-Look composer | `src/components/wardrobe/CompleteLookView.tsx` | Single "Save" button | Heart "Save + Favorite" companion next to existing Save |

## Implementation details

### 1. `OutfitSuggestionDrawer.tsx`
- Extend the per-suggestion saved-state from `Set<string>` to a small `Map<string, "saved" | "favorited">` so the icon row can reflect which button was used.
- Refactor `saveOutfit(outfit, idx)` → `saveOutfit(outfit, idx, { favorite: boolean })`. Single insert with `is_favorite: favorite`.
- Render order in the per-outfit header: `Wand2` (complete look) · **Heart** (new) · **Bookmark** (existing) · mood badge.
- Heart states:
  - default → outline Heart
  - in-flight → `Loader2`
  - after success → filled Heart in `text-primary` (matches `Outfits.tsx` styling for visual consistency)
- Disable both buttons once the outfit is saved (in either mode) to prevent duplicates within the session.
- Toast copy: `"Outfit saved!"` for Bookmark, `"Saved & favorited ❤️"` for Heart.

### 2. `OccasionOutfitDrawer.tsx`
Same pattern: bump `savedIds: Set<string>` → `savedState: Map<string, "saved" | "favorited">`, pass `{ favorite }` into `saveOutfit`, render the Heart next to the existing Bookmark, and use the same toast copy. The icon column already lives in the suggestion card header so it slots in cleanly.

### 3. `CompleteLookView.tsx`
- Refactor `handleSave` → `handleSave({ favorite: boolean })` and pass `is_favorite: favorite` into the insert.
- Add a second button beside the existing "Save" CTA labeled **"Save + Favorite"** with a Heart icon (filled on success). Both buttons share the `saving` lock and become disabled / show a check after a successful save.

### 4. No DB / RLS / schema changes required
`saved_outfits.is_favorite` already exists (`boolean`, default `false`) and current RLS already permits `INSERT WITH CHECK (auth.uid() = user_id)`. Inserting with `is_favorite: true` Just Works.

### 5. No changes to the Outfits page
The Heart toggle on the saved-outfit cards in `Outfits.tsx` already exists and continues to behave the same way (toggling `is_favorite` on existing rows). Outfits saved via the new Heart button will appear there with their Heart pre-filled — confirming the round-trip.

## What deliberately stays the same
- **Session-only saved state** — re-opening the drawer resets the indicators per the user's decision. No extra fetch on drawer open.
- **No new save targets** — we are not introducing a "save to collection" or tagging system. Just save and save+favorite.
- **No edits to existing Outfits-page heart toggle** — it already does the right thing.

## Files to edit
- `src/components/wardrobe/OutfitSuggestionDrawer.tsx`
- `src/components/wardrobe/OccasionOutfitDrawer.tsx`
- `src/components/wardrobe/CompleteLookView.tsx`

## Files NOT touched
- `src/pages/Outfits.tsx` — already has favorite/delete on saved cards
- `src/pages/Wardrobe.tsx` — only opens the drawer; no changes needed
- DB migrations — schema already supports this

## Verification
- TypeScript clean (`tsc --noEmit`).
- Manual flow: open suggestion drawer → tap Heart on outfit → toast "Saved & favorited ❤️" → both buttons disable on that card → navigate to Outfits page → outfit appears with Heart already filled.
- Manual flow: same drawer → tap Bookmark on a different outfit → toast "Outfit saved!" → outfit appears in Outfits page with Heart **unfilled**, and the existing toggle on that page can flip it on.
