

# Remove Auto-Open Drawer on Item Selection

## Problem
When a user taps a wardrobe item, the outfit suggestion drawer automatically opens (on first selection). The user wants item taps to only select/deselect -- matching should only start when they explicitly press a button.

## Solution
Remove the auto-open logic from `handleCardClick` and rely solely on the existing "Match These" button in the floating bar.

## Changes

### `src/pages/Wardrobe.tsx`

**1. Remove auto-open in `handleCardClick`**
Delete the lines that call `setDrawerOpen(true)` when the first item is selected (around line 68-70):

```typescript
// REMOVE these lines inside handleCardClick:
if (prev.length === 0) {
  setDrawerOpen(true);
}
```

**2. Rename button label**
Change "Match These" to "Match This Outfit" for clarity. Show it when 1 or more items are selected (not just 2+), so users always have a clear action available.

### Flow after fix

1. User taps items -- they highlight with a checkmark, nothing else happens
2. Floating bar appears showing selected count + "Match This Outfit" + "Clear All"
3. User taps "Match This Outfit" -- drawer opens and analysis begins

