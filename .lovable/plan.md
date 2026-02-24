

## Problem

Items added through the "Add Item" page are successfully saved to the database (`wardrobe_items` table), but they never appear on the Wardrobe page. This is because the Wardrobe page exclusively renders hardcoded `DEMO_WARDROBE` data and never queries the database.

## Root Cause

`src/pages/Wardrobe.tsx` imports and displays only `DEMO_WARDROBE` from `src/lib/wardrobe-data.ts`. There is no database fetch for user-added items.

## Solution

Merge database items with the demo wardrobe so that user-added items appear alongside the pre-loaded catalog.

### Changes

**1. `src/pages/Wardrobe.tsx`** -- Fetch and merge DB items

- Add a `useQuery` call to fetch all rows from `wardrobe_items` where `user_id` matches the logged-in user.
- Map each DB row into the same `WardrobeItem` shape used by the demo data (mapping `photo_url` to `photo`, casting types).
- Combine `DEMO_WARDROBE` + fetched DB items into a single array (`allItems`) used throughout the page.
- Replace all references to `DEMO_WARDROBE` / `wardrobeWithPhotos` with `allItems`.
- Show a subtle loading state while fetching.

**2. `src/pages/AddItem.tsx`** -- Invalidate wardrobe query on save

- After a successful insert, call `queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] })` so the Wardrobe page automatically refreshes when navigating back.
- Import `useQueryClient` from `@tanstack/react-query`.

### Technical Details

```text
Wardrobe.tsx data flow (after fix):

  DEMO_WARDROBE (static)
        |
        +---> merge ---> allItems ---> filtered ---> render
        |
  useQuery("wardrobe-items")
    SELECT * FROM wardrobe_items
    WHERE user_id = auth.uid()
```

The DB items will use `photo_url` for their image. Demo items keep using local asset imports. The `WardrobeItem` type already has an optional `photo` field, so no type changes are needed.

No database or RLS changes are required -- the existing policies correctly allow authenticated users to read their own items.

