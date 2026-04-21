

## Goal
Let users optionally upload/take a **back photo** of a garment alongside the front photo, so the wardrobe captures the full essence of an item (back details inform fit/style matching).

## Approach

### 1. Database — add `photo_back_url` column
New migration adds an optional `photo_back_url TEXT` column to `wardrobe_items`. Nullable, no default — fully backward compatible (existing items just don't have a back photo).

### 2. AddItem (single-item flow)
After the front photo is captured, reveal a small secondary "Add back photo (optional)" slot beneath it with two buttons:
- **Camera** → opens rear camera (capture="environment")
- **Choose** → file picker

Once captured, show a thumbnail with a small "Remove" button. Both photos upload to the `wardrobe-photos` bucket on save; the front URL goes to `photo_url`, back URL to `photo_back_url`.

The front photo continues to be the one sent to `analyze-clothing` (AI auto-tagging is anchored on the front view, unchanged behavior).

### 3. BatchAddItems (batch flow)
Each `BatchItemCard` gets a small "Add back" affordance in its expanded details section. Tapping it opens a per-item file/camera picker. Stores `backFile` + `backPreview` per item; uploads alongside the front on save.

To keep batch UX uncluttered, the back-photo control lives inside the **expanded details** panel (not the collapsed top bar), so users only see it when actively reviewing an item.

### 4. EditItemDialog
Add a second photo slot below the existing front-photo slot:
- Shows current `photo_back_url` if present
- "Replace" / "Camera" / "Remove back" buttons
- Plumbed through the existing `onSave` callback as `newBackPhotoFile?: File` and `removeBackPhoto?: boolean`

Wardrobe.tsx's update handler uploads the new back photo (if provided) and updates `photo_back_url` accordingly.

### 5. WardrobeItem type + mapping
- `src/lib/wardrobe-data.ts`: add `photo_back?: string` to `WardrobeItem` interface
- `src/hooks/useWardrobeItems.ts`: map `row.photo_back_url` → `photo_back`

### 6. Display the back photo (lightweight)
On `WardrobeItemCard`, if `photo_back` exists, show a tiny corner badge/icon (e.g. flip icon) indicating a back photo is available. Tapping the card's existing photo can flip-swap to the back view (simple onClick toggle, no fancy 3D flip needed). This is the only visual surface change — everything else uses `photo_url` as before.

### 7. Styling/matching impact (intentional out of scope for v1)
The back photo is captured and stored now, but the matcher/AI analysis still uses the front. A follow-up task can extend `analyze-clothing` to optionally accept both URLs and produce richer tags (e.g., back graphics, fit cues). Flagging as a future enhancement keeps this PR focused.

## Files touched
- **New migration**: `supabase/migrations/<ts>_add_photo_back_url.sql` — `ALTER TABLE wardrobe_items ADD COLUMN photo_back_url TEXT`
- `src/lib/wardrobe-data.ts` — add `photo_back?: string` to type
- `src/hooks/useWardrobeItems.ts` — map new column
- `src/pages/AddItem.tsx` — back-photo picker + upload on save
- `src/pages/BatchAddItems.tsx` — per-item back picker in expanded section + upload on save
- `src/components/wardrobe/EditItemDialog.tsx` — back photo slot + plumbing
- `src/pages/Wardrobe.tsx` — handle `newBackPhotoFile` / `removeBackPhoto` in the edit save handler
- `src/components/wardrobe/WardrobeItemCard.tsx` — small "back available" indicator + tap-to-flip preview
- **Memory update**: append a short note to `mem://features/wardrobe/item-metadata` documenting the optional back photo

## Verification checklist
- Add an item with both front + back photos → both URLs persist; both visible in edit dialog.
- Add an item with front only → back column is null; UI still works (no back indicator).
- Edit an existing item and add a back photo → saves correctly.
- Edit an existing item and remove the back photo → column is cleared.
- Batch add: front-only and front+back items in the same batch save correctly.
- Tap the photo on a card with a back photo → flips to back view, tap again → back to front.
- Existing items (no back photo) render unchanged.

