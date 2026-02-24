
## Save Shopping Item to Wardrobe

Add a "Save to Wardrobe" button on the Shop page results so users can add an analyzed item directly to their wardrobe without leaving the page.

### What changes

**`src/pages/Shop.tsx`**

1. Import `useQueryClient` from `@tanstack/react-query` and add `Plus` icon from lucide-react.
2. Add state: `saving` (boolean) and `saved` (boolean) to track the save flow.
3. Add a `handleSaveToWardrobe` function that:
   - Inserts a row into `wardrobe_items` using the already-analyzed metadata (`analyzedItem`) and the already-uploaded photo URL.
   - Since the photo was already uploaded to `wardrobe-photos` storage during analysis, we need to store that URL. A small refactor will save the uploaded `publicUrl` into component state (e.g., `uploadedPhotoUrl`) so it can be reused at save time.
   - Invalidates the `wardrobe-items` query cache so the Wardrobe page picks up the new item.
   - Shows a success toast and sets `saved = true`.
4. Render a "Save to Wardrobe" button in the results section (between the analyzed item badge area and the outfit cards). When `saved` is true, the button changes to a disabled "Saved" state with a checkmark.
5. Reset `saved` state in the `reset()` function.

### Technical details

- The photo is already uploaded during `handleAnalyzeAndMatch` (line 72-76), so we just need to capture the public URL in state rather than re-uploading.
- The insert mirrors the pattern from `AddItem.tsx` (lines 129-138): `supabase.from("wardrobe_items").insert({ user_id, name, category, primary_color, color_hex, style_tags, photo_url, is_new: true })`.
- No database or RLS changes needed -- existing policies allow authenticated users to insert their own items.
