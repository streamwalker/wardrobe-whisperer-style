

# Export/Import Wardrobe as JSON

## Overview
Add **Export** and **Import** buttons to the Wardrobe page that let you download all your wardrobe items (both demo and user-added) as a JSON file, and re-import that file into any other project instance to recreate those items in the database.

## How It Works

### Export
- Clicking "Export" serializes all wardrobe items (name, category, primary_color, color_hex, style_tags, photo_url, is_new, is_featured) into a JSON file
- Downloads as `wardrobe-export-YYYY-MM-DD.json`
- Photo URLs are included as-is (public URLs will still work across projects)

### Import
- Clicking "Import" opens a file picker for `.json` files
- Parses the file and validates the structure
- Inserts all items into `wardrobe_items` with the current user's ID
- Shows a toast with the count of items imported
- Refreshes the wardrobe list

## UI Changes

### Wardrobe.tsx
- Add two new buttons in the header row (next to existing Transfer/Redeem):
  - **Export** button with `Download` icon
  - **Import** button with `Upload` icon
- Export triggers a JSON download directly (no dialog needed)
- Import uses a hidden file input element

## JSON Format

```text
{
  "version": 1,
  "exportedAt": "2026-03-01T...",
  "items": [
    {
      "name": "Court Green",
      "category": "shoes",
      "primary_color": "Green",
      "color_hex": "#6B8E6B",
      "style_tags": ["casual", "bold"],
      "is_new": false,
      "is_featured": true,
      "photo_url": "https://..."
    }
  ]
}
```

## Technical Details

### New component: `ExportImportButtons.tsx`
- Handles export logic: queries all user's `wardrobe_items` from DB, merges with demo items, builds JSON, triggers download via `Blob` + `URL.createObjectURL`
- Handles import logic: hidden `<input type="file">`, parses JSON, validates schema, batch-inserts into `wardrobe_items` via Supabase client
- No new database changes needed -- uses existing `wardrobe_items` table and RLS policies

### Validation on import
- Checks for `version` and `items` array
- Validates each item has required fields (name, category, primary_color)
- Skips invalid items with a warning toast
- Inserts in batches to avoid hitting request size limits

### No migration needed
All operations use existing tables and RLS policies. The current user's auth token ensures items are inserted with their `user_id`.

