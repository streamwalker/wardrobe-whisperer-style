

# Add "Clear All" Button for Wardrobe Selection

## Problem
There's no easy way to deselect all selected wardrobe items at once. The only option is the small X button on the floating bar, which only appears when 2+ items are selected.

## Solution
Add a visible "Clear All" button that appears whenever any items are selected (1 or more), allowing quick deselection of all items.

## Changes

### `src/pages/Wardrobe.tsx`

- Update the floating multi-select bar to appear when **1 or more** items are selected (currently requires 2+)
- The bar already has a clear button (X icon) -- rename/restyle it to say "Clear All" for better clarity
- When only 1 item is selected, show the item count and the Clear All button (hide "Match These" since matching needs 2+ items)

### Layout

```text
1 item selected:   [ 1 item selected ] [ Clear All ]
2+ items selected: [ 3 items selected ] [ Match These ] [ Clear All ]
```

### Technical details
- Change the condition `selectedItems.length >= 2` to `selectedItems.length >= 1` for showing the bar
- Replace the icon-only X button with a text "Clear All" button
- Conditionally show the "Match These" button only when `selectedItems.length >= 2`

