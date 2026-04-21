

## Goal
When a user adds a new wardrobe item (single or batch), automatically generate AI outfit suggestions built around that item and surface them in a celebratory drawer with a full visual look, mood badge, and styling rationale — so users immediately see how their new piece fits into their existing wardrobe.

## Approach

### 1. Reuse the existing match engine
The `match-outfit` edge function and `OutfitSuggestionDrawer` already do exactly what we need: take an anchor item + the rest of the wardrobe and return styled outfits with explanations and mood tags. No backend or AI changes required.

### 2. Trigger after a successful add

**Single add (`src/pages/AddItem.tsx`)**
After the `wardrobe_items` insert succeeds, instead of immediately navigating back to `/wardrobe`:
- Refetch the user's wardrobe (or read from the cached `useWardrobeItems`).
- Find the newly inserted item by id.
- Open `OutfitSuggestionDrawer` inline with `items={[newItem]}` and `allWardrobeItems={items}`.
- The drawer's existing `useEffect` auto-fires `match-outfit` on mount → user immediately sees 3 looks featuring their new piece.
- Drawer close → navigate back to `/wardrobe`.

Guard: only fire if the user has ≥2 other items in the wardrobe (otherwise there's nothing to pair with — show a small toast "Add a few more items to start getting outfit ideas" and navigate back).

**Batch add (`src/pages/BatchAddItems.tsx`)**
After the batch insert succeeds:
- If exactly one item was added → behave like single add.
- If multiple items added → open the drawer with `items` = the newly added items (the matcher already handles multi-anchor; existing Outfits page uses the same pattern). Header copy adjusts to "Outfits with your new pieces".

### 3. New "just added" header on the drawer
Add a small optional prop `headline?: string` to `OutfitSuggestionDrawer` (default unchanged). When provided, replace the existing "Outfit Ideas" title with a celebratory header:
- ✨ icon + "Fresh additions to your wardrobe"
- Subtitle: "Here's how [item name] (or "your new pieces") works with what you already own."

This keeps the post-add surface visually distinct from the regular tap-an-item flow without forking the component.

### 4. Bookmark / dismiss behavior
- "Save Outfit" button already persists to `saved_outfits` — no change.
- Drawer close button → navigates user to `/wardrobe` (single add) or stays on `/wardrobe` (batch was already navigated there).
- "Load More" / "Skip This" continue to work as-is.

### 5. Empty / error states
- If `match-outfit` returns no outfits or fails, drawer already shows the existing empty/error state — user can dismiss and continue. We add a one-line fallback toast "Item added — try tapping it from your wardrobe to see outfit ideas."
- Free-tier users hitting the AI limit: existing edge function error handling surfaces the message in the drawer, unchanged.

### 6. Files touched
- **Edit:** `src/components/wardrobe/OutfitSuggestionDrawer.tsx` — accept optional `headline` + `subheadline` props; render them when provided in place of the default title.
- **Edit:** `src/pages/AddItem.tsx` — after insert, fetch the new item, open the drawer with the celebratory headline; navigate to `/wardrobe` on close.
- **Edit:** `src/pages/BatchAddItems.tsx` — after batch insert, open the drawer with all newly-added items as anchors and a "your new pieces" headline; navigate to `/wardrobe` on close.

No new tables, no new edge functions, no schema changes, no new dependencies.

## Verification checklist
- Add a single item → drawer opens automatically with 3 outfit ideas built around that item, each with the new `OutfitPreviewBoard` comparison and rationale.
- Add a batch of 3 items → drawer opens with looks anchored on all 3; headline reads "Fresh additions to your wardrobe".
- Wardrobe with <2 other items → no drawer, friendly toast instead, navigate back normally.
- Save an outfit from the drawer → appears in `/outfits` as expected.
- Close drawer → returns to `/wardrobe`.
- Existing tap-an-item flow on `/wardrobe` still works exactly as before (no headline override).
- Free-tier AI cap or network error → existing error UI handles it gracefully.

