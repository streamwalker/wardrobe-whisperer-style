

# Add Item Page with AI Auto-Detect

## Problem
The "+" button in the header navigates to `/wardrobe/add`, but no route or page exists for it, resulting in a 404.

## Solution
Create an "Add Item" page where the user uploads a photo, the AI automatically detects the category, color, and style tags, and the user can review/edit before saving.

## Flow
1. User taps "+" in the header, navigates to `/wardrobe/add`
2. User uploads or takes a photo of a clothing item
3. Photo is uploaded to the `wardrobe-photos` storage bucket
4. A new edge function (`analyze-clothing`) sends the image URL to the AI (Gemini with vision) and returns detected category, primary color, color hex, style tags, and a suggested name
5. The form pre-fills with AI results; user can edit any field
6. On save, a row is inserted into `wardrobe_items` with the user's ID
7. User is redirected back to `/wardrobe`

## Changes

### 1. New Route in `src/App.tsx`
- Add a `/wardrobe/add` route inside the `AppLayout` layout, before the `/wardrobe` route
- Import and render a new `AddItem` page component

### 2. New Page: `src/pages/AddItem.tsx`
- Photo upload area (tap to select or take photo)
- Upload the image to `wardrobe-photos` bucket via the storage SDK
- Call the `analyze-clothing` edge function with the public image URL
- Show a loading spinner while AI analyzes
- Display pre-filled form fields: name, category (dropdown), primary color, color hex (color swatch), style tags (multi-select chips)
- "Save to Wardrobe" button inserts into `wardrobe_items` table
- Back button in the header to return to wardrobe
- Requires authentication -- redirect to `/auth` if not logged in

### 3. New Edge Function: `supabase/functions/analyze-clothing/index.ts`
- Receives `{ imageUrl: string }`
- Uses `google/gemini-3-flash-preview` (multimodal) via the Lovable AI gateway
- Sends the image as a URL in the message content (using the vision format: `{ type: "image_url", image_url: { url } }`)
- Uses structured tool output to return:
  - `name` (string) -- suggested item name
  - `category` (shoes | pants | tops | outerwear)
  - `primary_color` (string, e.g., "Navy")
  - `color_hex` (string, e.g., "#2C3E50")
  - `style_tags` (array of casual/neutral/bold/luxury/minimal/sporty)
- Standard CORS and error handling (429, 402)

### 4. No Database Changes Needed
- The `wardrobe_items` table already has all the right columns (name, category, primary_color, color_hex, style_tags, photo_url, user_id, is_new, is_featured)
- The `wardrobe-photos` storage bucket already exists and is public
- RLS policies on `wardrobe_items` already allow authenticated users to insert their own items

### 5. Storage RLS
- Need to add storage RLS policies so authenticated users can upload to the `wardrobe-photos` bucket (INSERT policy on `storage.objects`)

## Technical Details

**Edge function AI prompt (system):**
```text
You are a fashion item analyzer. Given a photo of a clothing item, identify:
- A short descriptive name (2-3 words, e.g. "Navy Chinos", "White Sneakers")
- The category: shoes, pants, tops, or outerwear
- The dominant/primary color name (e.g. "Navy", "Cream", "Olive")
- The hex code of that color
- 1-3 style tags from: casual, neutral, bold, luxury, minimal, sporty
```

**Image message format for Gemini vision:**
```text
messages: [
  { role: "system", content: systemPrompt },
  { role: "user", content: [
    { type: "image_url", image_url: { url: imageUrl } },
    { type: "text", text: "Analyze this clothing item." }
  ]}
]
```

**Form UI layout:**
```text
+------------------------------------------+
|  < Back           Add Item               |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  |                                    |  |
|  |     [Photo preview / Upload area]  |  |
|  |     Tap to upload a photo          |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
|  Analyzing... (spinner, shown during AI) |
|                                          |
|  Name:     [  Navy Chinos            ]   |
|  Category: [ Pants          v        ]   |
|  Color:    [  Navy  ] [##2C3E50]         |
|  Style:    [casual] [neutral] [minimal]  |
|                                          |
|  [ Save to Wardrobe ]                    |
+------------------------------------------+
```

