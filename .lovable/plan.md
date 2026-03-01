

# Eliminate Duplicate Wardrobe Items

## Problem
The wardrobe page merges two data sources:
1. **Hardcoded demo items** (32 items in `DEMO_WARDROBE` array in `wardrobe-data.ts`)
2. **Database items** (fetched from `wardrobe_items` table)

Nearly all 32 demo items also exist as rows in the database (likely from a previous import), causing each to appear twice. There are no duplicates *within* the database itself.

## Solution
Deduplicate in `Wardrobe.tsx` by filtering out database items whose names match a demo item (case-insensitive). This way:
- Demo items (with their local photos) are always shown
- Only truly unique user-added items from the DB are appended
- No data is deleted -- the DB rows remain but aren't shown twice

## Changes

### `src/pages/Wardrobe.tsx`
Update the merge logic (around line 75-77) where `allItems` is constructed:

**Before:**
```typescript
const allItems = [...DEMO_WARDROBE, ...userItems];
```

**After:**
```typescript
const demoNames = new Set(DEMO_WARDROBE.map((d) => d.name.toLowerCase()));
const uniqueUserItems = userItems.filter((i) => !demoNames.has(i.name.toLowerCase()));
const allItems = [...DEMO_WARDROBE, ...uniqueUserItems];
```

This is a 2-line addition that prevents any demo-matching DB items from appearing twice, while keeping all unique user-added items visible.

## Why Not Delete from DB?
Keeping the DB rows intact is safer -- if demo items are ever removed from the code in the future, the user's data persists. The dedup is purely a display-level filter.
