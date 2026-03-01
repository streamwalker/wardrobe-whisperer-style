

# Remove Hardcoded Demo Data -- Database Only

## Overview
Remove the `DEMO_WARDROBE` array and all 26 static image imports from `wardrobe-data.ts`, making the app rely entirely on database items. The types, constants (CATEGORIES, filters), and utility functions remain.

## Files to Change

### 1. `src/lib/wardrobe-data.ts`
- Delete all 26 image imports at the top
- Delete the entire `DEMO_WARDROBE` array (32 items)
- Keep: `WardrobeItem` interface, `WardrobeCategory`, `StyleTag`, `ColorTone` types, `CATEGORIES`, `TONE_FILTERS`, `STYLE_FILTERS`, `getColorTone()`

### 2. `src/pages/Wardrobe.tsx`
- Remove `DEMO_WARDROBE` from import
- Remove dedup logic (`demoNames`, `uniqueUserItems`)
- Set `allItems = userItems` directly
- All items are now DB items, so remove the `userItemIds` gate on delete/edit -- every item is editable/deletable

### 3. `src/pages/Outfits.tsx`
- Remove `DEMO_WARDROBE` from import
- Change `allItems` from `[...DEMO_WARDROBE, ...userItems]` to just `userItems`

### 4. `src/pages/Shop.tsx`
- Remove `DEMO_WARDROBE` from import
- Fetch user's DB wardrobe items (same query pattern as Wardrobe.tsx) and use those for outfit matching instead of the hardcoded list
- Update `getItemById` to use the fetched items

## What Stays Unchanged
- `wardrobe-data.ts` still exports all types, interfaces, category/filter constants, and utility functions
- Components that only import types (`WardrobeItemCard`, `EditItemDialog`, `ExportImportButtons`, `OutfitSuggestionDrawer`, `OccasionOutfitDrawer`, `SharedWardrobe`) need no changes
- Database rows are untouched

## Risk
Users who haven't imported the demo data into their DB will see an empty wardrobe. Since the DB already contains copies of all demo items for the current user, this should be seamless.

