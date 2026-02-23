

# Enforce One Item Per Category in Multi-Select

## Problem
Currently you can select multiple items from the same category (e.g., two pairs of shoes), which doesn't make sense since outfits use exactly one item per category.

## Solution
When tapping an item to add it to the selection, check if an item from that category is already selected. If so, **replace** the existing item in that category with the newly tapped one instead of adding a second.

## Change

**File: `src/pages/Wardrobe.tsx`** -- update the `handleCardClick` function (lines 21-33):

- When adding to multi-select (the `else` branch on line 30), check if any already-selected item shares the same `category` as the new item
- If a duplicate category exists, swap it out (replace the old item with the new one)
- If no duplicate, add normally

Updated logic:
```text
else {
  setSelectedItems((prev) => {
    const withoutSameCategory = prev.filter(
      (i) => i.category !== item.category
    );
    return [...withoutSameCategory, item];
  });
}
```

This also applies to the single-item case (line 25-28): after the first item is selected and the drawer opens, subsequent taps will correctly swap within the same category.

## User Experience
- Tap Nike shoes -> selected
- Tap another pair of shoes -> first pair is deselected, new pair is selected (swap)
- Tap a pair of pants -> both shoes and pants are now selected
- A brief toast notification will appear: "Swapped [category]" so the user understands why the previous item disappeared

No other files need changes.

