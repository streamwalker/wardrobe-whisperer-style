

# Generate Images for Wardrobe Items Without Photos

## Problem
7 wardrobe items currently have no photo and only show a solid color swatch:
- Cream Shirt (tops)
- White Shirt (tops)
- Taupe Shirt (tops)
- Olive Shirt (tops)
- Oatmeal Hoodie (outerwear)
- Gray Hoodie (outerwear)
- Black Hoodie (outerwear)

## Solution
Create a backend function that uses AI image generation to produce a product-style photo for each item, store the images in file storage, and update the wardrobe data to reference them.

## How It Works

1. **New backend function** (`generate-clothing-image`): Takes a clothing description (name, color, category) and generates a realistic product photo using `google/gemini-3-pro-image-preview` (higher quality model). It then uploads the resulting image to a storage bucket and returns the public URL.

2. **Storage bucket** (`wardrobe-images`): A new public bucket to hold the generated images.

3. **New page/button in the UI**: Add a "Generate Missing Images" button on the Wardrobe page (or run it automatically). For each item without a photo, it calls the backend function, gets back a URL, and updates the item's photo in local state.

4. **Update wardrobe data**: Once images are generated and stored, update `wardrobe-data.ts` to reference the storage URLs as default photos for these items so they persist across sessions.

## Step-by-Step Changes

### 1. Create storage bucket (SQL migration)
Create a public `wardrobe-images` bucket with a permissive read policy so generated images are accessible.

### 2. Create edge function `generate-clothing-image`
- Accepts `{ name, category, primary_color, color_hex }` in the request body
- Sends a prompt to `google/gemini-3-pro-image-preview` like: *"Generate a clean product photo of a [Cream] [Shirt] on a plain white background, fashion e-commerce style, no model, flat lay"*
- Extracts the base64 image from the response
- Uploads it to the `wardrobe-images` bucket with a filename like `cream-shirt.png`
- Returns the public URL

### 3. Add UI trigger in `src/pages/Wardrobe.tsx`
- Add a small "Generate images" button (visible only when items are missing photos)
- On click, iterate through items without photos, call the edge function for each
- Show a progress indicator (e.g., "Generating 3/7...")
- Update local state with the returned image URLs

### 4. Update `src/lib/wardrobe-data.ts`
- After generation, the photo URLs from storage will be used
- Items will reference their storage URL in the `photo` field

## Technical Details

**Image generation prompt template:**
```text
Generate a clean product photo of a {primary_color} {name} ({category}).
Fashion e-commerce style, plain white background, no model, flat lay view.
Realistic fabric texture, soft studio lighting.
```

**Edge function structure:**
```text
POST /generate-clothing-image
Body: { name, category, primary_color, color_hex }
Response: { url: "https://...supabase.co/storage/v1/object/public/wardrobe-images/cream-shirt.png" }
```

**Storage bucket policy:** Public read access so images can be displayed without auth.

**Files to create:**
- `supabase/functions/generate-clothing-image/index.ts`

**Files to modify:**
- `src/pages/Wardrobe.tsx` (add generate button + logic)
- `src/lib/wardrobe-data.ts` (update photo references after generation)

**Database migration:**
- Create `wardrobe-images` storage bucket with public read policy

