

# Show Saved Outfits on the Outfits Page

## Overview
Add the ability to save AI-generated outfit suggestions and display them on the Outfits page with full visual detail -- item thumbnails, AI explanations, and mood badges.

## Changes

### 1. Add "Save Outfit" Button to the Suggestion Drawer
**File: `src/components/wardrobe/OutfitSuggestionDrawer.tsx`**
- Add a heart/bookmark icon button on each outfit suggestion card
- On tap, save the outfit to the `saved_outfits` database table (name, item_ids, mood, explanation)
- If the user is not signed in, show a toast prompting them to sign in first
- Disable the button and show a checkmark if the outfit is already saved (match by name + item_ids)

### 2. Create an Auth Context Hook
**File: `src/hooks/useAuth.ts`**
- Simple hook that listens to the auth state and returns the current user (or null)
- Reusable across components that need to check login status

### 3. Rebuild the Outfits Page
**File: `src/pages/Outfits.tsx`**
- If not signed in: show the current empty state with a "Sign in to save outfits" message
- If signed in: fetch saved outfits from the `saved_outfits` table using React Query
- Display each saved outfit as a card with:
  - Outfit name and mood badge (same style as the drawer)
  - Horizontal row of item thumbnails (resolved from `DEMO_WARDROBE` by ID)
  - AI explanation text
  - A favorite toggle (heart icon) updating `is_favorite` in the database
  - A delete button to remove saved outfits
- Empty state when signed in but no saved outfits yet

### 4. No Database Changes Needed
The `saved_outfits` table already exists with the correct schema (name, item_ids, mood, explanation, is_favorite, user_id) and full RLS policies for CRUD operations.

## Technical Details

- The `item_ids` column is typed as `uuid[]` in the database, but the demo wardrobe uses string IDs like `s1`, `p1`. The column will store these string values (Postgres text-compatible).
- Item thumbnails will be resolved client-side by looking up each ID in `DEMO_WARDROBE`.
- React Query will handle caching and refetching of saved outfits.
- The save operation will use `supabase.from('saved_outfits').insert(...)` with the authenticated user's ID.

