

## Fix: Generated Images Not Persisting to Database

### Problem
The "Generate Images" feature calls the `generate-clothing-image` edge function and stores the returned URL in local React state (`generatedPhotos`). This means:
- Generated photos disappear on page refresh or navigation
- The `photo_url` column in the database stays `null`
- Items like Gray Hoodie and Black Hoodie that had images generated lose them

### Fix

**Update `handleGenerateImages` in `src/pages/Wardrobe.tsx`** to persist each generated photo URL to the database immediately after generation:

After `setGeneratedPhotos(...)` succeeds with a URL, add a database update:
```ts
await supabase.from("wardrobe_items")
  .update({ photo_url: data.url })
  .eq("id", item.id);
```

Then invalidate the query cache so the persisted URL is reflected. This way generated images survive page refreshes and show up everywhere (Outfits, shared wardrobes, PDF exports, etc.).

### Files to Change
1. **`src/pages/Wardrobe.tsx`** — Add `supabase.update` call inside `handleGenerateImages` loop after successful generation, and invalidate the query cache after the loop completes.

