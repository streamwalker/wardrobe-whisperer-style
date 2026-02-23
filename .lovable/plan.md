
# Independent Scrolling Columns for Wardrobe Categories

## Problem
Currently, the "All" view shows category columns in a grid, but scrolling moves the entire page. You can't scroll through shoes without also scrolling pants, tops, and outerwear.

## Solution
Give each category column its own independent scroll area with a fixed height, so scrolling within one column doesn't affect the others.

## Changes

### `src/pages/Wardrobe.tsx`
- Wrap the "All" view grid in a container with a calculated height (filling available viewport space minus header/tabs)
- Give each category column a fixed height with `overflow-y-auto` and the `scrollbar-none` utility so each scrolls independently
- The sticky category header stays pinned at the top of each column as you scroll within it
- The outer page will no longer scroll through the items grid -- each column handles its own scrolling

### Key layout structure:

```text
+--------------------------------------------------+
| Header + Category Tabs (fixed at top)            |
+----------+----------+----------+------------------+
| Shoes    | Pants    | Tops     | Outerwear        |  <-- sticky headers
|----------|----------|----------|------------------|
| [scroll] | [scroll] | [scroll] | [scroll]         |  <-- independent scroll
| [card]   | [card]   | [card]   | [card]           |
| [card]   | [card]   | [card]   | [card]           |
| [card]   |          | [card]   |                  |
+----------+----------+----------+------------------+
| Bottom Nav                                        |
+--------------------------------------------------+
```

### Technical approach
- Set the grid container to `h-[calc(100vh-<offset>)]` to fill remaining viewport height (accounting for header, tabs, and bottom nav -- approximately 260px offset)
- Each category column gets: `overflow-y-auto scrollbar-none` with `h-full`
- The category header inside each column stays `sticky top-0` so it remains visible while scrolling items

### File modified
- `src/pages/Wardrobe.tsx` -- only the "All" view rendering block (lines 169-193)
