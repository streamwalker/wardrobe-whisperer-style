

# Fix: Add useEffect to Trigger Outfit Suggestions

## Problem
The drawer opens but never fetches outfit suggestions because the fetch logic is inside `handleOpenChange`, which doesn't fire when the parent sets `open={true}`.

## Fix
**File: `src/components/wardrobe/OutfitSuggestionDrawer.tsx`**

- Add a `useEffect` that calls `fetchSuggestions` when `open` becomes `true` with a new item
- Simplify `handleOpenChange` to only forward the state change to the parent

```typescript
useEffect(() => {
  if (open && item && hasLoaded !== item.id) {
    fetchSuggestions(item);
  }
}, [open, item]);
```

- Remove the fetch logic from `handleOpenChange`, leaving just `onOpenChange(isOpen)`

No other files need changes.

