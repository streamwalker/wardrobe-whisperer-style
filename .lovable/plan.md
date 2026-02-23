

# "Show More" Outfit Suggestions

## Overview
Add a "Show More Suggestions" button at the bottom of the outfit results so you can keep loading 3 new, unique outfit combinations each time you tap it -- until no more unique combinations are possible.

## How It Works
1. You tap an item and get the first 3 outfit suggestions (works the same as today)
2. At the bottom of those results, a button appears: "Show 3 More Ideas"
3. Tapping it calls the AI again, but this time tells it which outfits were already shown so it generates different ones
4. The new 3 outfits get appended below the existing ones (you keep scrolling to see all)
5. If the AI can't produce any new unique combos, the button disappears and a message says "No more combinations available"

## Changes

### 1. Edge Function Update (`supabase/functions/match-outfit/index.ts`)
- Accept a new optional field `excludeOutfits` in the request body -- an array of item_id sets that were already suggested
- Add an instruction to the user prompt telling the AI: "Do NOT repeat any of these previously suggested outfits" followed by the excluded combos
- This ensures each "Show More" call returns fresh combinations

### 2. Drawer Component Update (`src/components/wardrobe/OutfitSuggestionDrawer.tsx`)
- Track all loaded outfits across multiple rounds (accumulate instead of replace)
- Track whether more suggestions are available (`hasMore` state, defaults to `true`)
- Add a `loadMore` function that calls the edge function with the previously shown outfit item_id sets
- If the AI returns 0 outfits or fewer than 3, set `hasMore = false`
- Add a "Show 3 More Ideas" button at the bottom of the outfit list
- Show "No more combinations available" text when `hasMore` is false
- Reset all state when a new item is selected

### 3. No Other Files Change
The wardrobe page, card component, and edge function structure stay the same.

## Technical Details

**New request body shape:**
```json
{
  "selectedItem": { ... },
  "wardrobeItems": [ ... ],
  "excludeOutfits": [
    ["id1", "id2", "id3", "id4"],
    ["id1", "id5", "id6", "id7"]
  ]
}
```

**Edge function prompt addition:**
```
Do NOT reuse any of the following outfit combinations (listed by item IDs):
- Outfit 1: id1, id2, id3, id4
- Outfit 2: id1, id5, id6, id7
...
```

**Drawer state changes:**
- `outfits` accumulates across rounds (append, not replace)
- `hasMore` boolean controls button visibility
- `loadingMore` boolean shows spinner on the "Show More" button (separate from initial load spinner)
- `hasLoaded` cache is cleared when switching items so fresh suggestions load

