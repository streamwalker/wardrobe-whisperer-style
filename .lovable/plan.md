

## Fix: Category Updates Failing Due to Database Constraint Mismatch

### Root Cause
The database has a CHECK constraint on `wardrobe_items.category` that only allows: `shoes, pants, tops, outerwear, suits, accessories`. However, the frontend defines an additional category `dress-shoes` that the database doesn't accept. When a user changes an item to `dress-shoes` (or any unlisted category), the save silently fails with a 400 error.

### Fix (Two Parts)

**1. Update the database CHECK constraint** to include `dress-shoes`:
- Run a migration to drop the old constraint and add a new one that includes all 7 categories.

```sql
ALTER TABLE public.wardrobe_items DROP CONSTRAINT wardrobe_items_category_check;
ALTER TABLE public.wardrobe_items ADD CONSTRAINT wardrobe_items_category_check 
  CHECK (category = ANY (ARRAY['shoes','pants','tops','outerwear','suits','accessories','dress-shoes']));
```

**2. Improve error handling in `handleEditItem`** (`src/pages/Wardrobe.tsx`):
- The `onSave` callback in `EditItemDialog` catches errors but doesn't show them to the user. Add a try/catch around the `handleEditItem` call or ensure errors from the thrown error propagate to a toast, so users see a clear message if a save fails for any reason.

Currently in `EditItemDialog.tsx`, `handleSave` calls `await onSave(...)` inside a try block but the `catch` is empty (only `finally` runs). The error thrown in `handleEditItem` goes unhandled. We should add `catch (err) { toast.error("Failed to save changes"); }` in `EditItemDialog.tsx`'s `handleSave`, or handle it in the parent.

### Summary
- Database migration: Add `dress-shoes` to the category check constraint
- Code fix: Surface save errors to the user via toast in `EditItemDialog.tsx`

