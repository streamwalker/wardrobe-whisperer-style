

## Auto-Navigate to New Category After Edit

When a user changes an item's category in the Edit dialog, automatically switch the active category tab to the new category so the item visibly "moves" to its new home.

### Change

**File: `src/pages/Wardrobe.tsx`** -- Update `handleEditItem` to check if the category changed, and if so, call `setActiveCategory(updates.category)` after the successful database update. This way, after saving, the view switches to show the target category tab where the moved item now appears.

Specifically, after line 178 (`toast.success("Item updated")`), add:

```typescript
// If category changed, switch tab to the new category
if (editingItem && updates.category !== editingItem.category) {
  setActiveCategory(updates.category as WardrobeCategory);
}
```

No other files need changes -- the database update and query invalidation already handle the data move correctly.

