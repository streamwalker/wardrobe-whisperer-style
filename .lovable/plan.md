

## Goal
Let the user **snap a live photo or upload a screenshot** (e.g. an outfit they saw on Instagram, a celeb on the red carpet, a magazine spread) on the **Outfits page**, then have the app instantly generate **3 outfit ideas built from items the user already owns** that recreate the vibe of the uploaded image.

This is a new entry point distinct from:
- The existing **Add Item** flow (analyzes a single garment and saves it to the wardrobe).
- The existing **tap-an-item** flow (anchors suggestions on a known wardrobe piece).
- The existing **occasion** flow (text-based prompt).

The new flow is **inspiration-driven**: the user shows the AI a *look they want*, and the AI maps it to *what they own*.

---

## Approach

### 1. New "Inspire Me" entry on the Outfits page
Add a new card/button to `src/pages/Outfits.tsx`, sitting next to the existing occasion suggestion CTA:

- Label: **"Recreate a Look"** with a `Camera` + `Sparkles` icon and a one-line subtitle ("Snap or upload an inspiration photo").
- Tapping it opens a **bottom sheet** (`Sheet`) with three options, mirroring the AddItem pattern:
  - **Take Photo** (`capture="environment"`) — visionOS/iOS will route to camera.
  - **Choose Photo** — picks from gallery / screenshots folder.
  - **Cancel**.

We reuse the existing dual hidden-input pattern from `AddItem.tsx` so visionOS PWA compatibility is preserved (per the visionOS memory rule about separate capture/library triggers).

### 2. New edge function: `inspire-outfit`
Create `supabase/functions/inspire-outfit/index.ts`. It:

1. Accepts `{ imageUrl: string, wardrobeItems: WardrobeItemLite[] }` (photo-stripped, like the existing `match-outfit` payload).
2. Uses **Lovable AI Gateway** with a vision-capable model (`google/gemini-2.5-flash`) to:
   - First **analyze the inspiration image**: extract a structured "look brief" (vibe, dominant colors, silhouette, formality level, key garment categories visible — e.g. *"oversized cream knit, dark wash straight-leg denim, white sneakers, casual elevated, neutral palette"*).
   - Then, given the wardrobe catalog, return **3 outfits** reusing the same JSON shape the existing drawer already consumes: `{ outfits: [{ name, item_ids, explanation, mood }] }`.
3. Reuses the same hard-style rules and styling principles already enforced in `match-outfit` (import from `_shared/dress-shirt-rules.ts` / inline the prohibitions block) so the inspire endpoint can't violate the prohibitions memory rule (no suits with sneakers, etc.).
4. CORS via `corsHeaders` from `@supabase/supabase-js/cors`, returns 402 / 429 mapping for credit/rate errors using the same pattern as the other edge functions.
5. Validates body with Zod (imageUrl URL, wardrobeItems array non-empty).
6. `verify_jwt` stays at the project default — no `config.toml` change needed.

### 3. Photo upload pipeline (client side)
On file pick:

1. Show a small in-sheet preview + spinner ("Analyzing your inspiration…").
2. Upload the file to the existing `wardrobe-photos` storage bucket under a dedicated `${user.id}/inspiration/` prefix to keep things tidy. (No new bucket / no migration — the bucket and RLS policies already exist.)
3. Get the public URL.
4. Strip photos from the wardrobe array (same pattern as `OutfitSuggestionDrawer.fetchSuggestions`).
5. Invoke `inspire-outfit` with `{ imageUrl, wardrobeItems }`.
6. Close the option sheet, open the existing **`OutfitSuggestionDrawer`** with:
   - `items={[]}` (no anchor pieces — the inspiration *is* the anchor).
   - `allWardrobeItems={items}`.
   - New optional prop `prefetchedOutfits` so the drawer skips its internal `match-outfit` call and renders the AI-returned outfits directly.
   - `headline="Looks inspired by your photo ✨"`.
   - `subheadline="Built from your wardrobe — save the ones you love."`.
   - We also pass `inspirationImageUrl` so the drawer can render a **small "inspiration" thumbnail** at the top of each suggestion card's left preview slot (in place of the empty "your pick" board).

### 4. Drawer changes (`OutfitSuggestionDrawer.tsx`)
Two small additions:

- New optional prop `prefetchedOutfits?: OutfitSuggestion[]` — when present, the drawer initializes `outfits` from it on open and **skips its initial `fetchSuggestions` call**. "Load More" remains hidden in this mode (no anchor items to feed back to `match-outfit` for follow-ups). We surface a small "Try another photo" hint at the bottom instead.
- New optional prop `inspirationImageUrl?: string` — when set, the left side of each comparison row shows a single tile with the inspiration image (rounded, with a small "Inspiration" label) instead of the existing `OutfitPreviewBoard items={items}` (which would be empty in this mode).

This keeps a single drawer component handling all three modes (anchor item, occasion, inspiration) — no duplication.

### 5. Files touched

- **New:** `supabase/functions/inspire-outfit/index.ts` — vision analysis + outfit matching against catalog.
- **Edit:** `src/pages/Outfits.tsx` — add the "Recreate a Look" card, the option sheet, the file inputs, the upload + invocation flow, drawer wiring with prefetched outfits.
- **Edit:** `src/components/wardrobe/OutfitSuggestionDrawer.tsx` — accept `prefetchedOutfits` and `inspirationImageUrl`; render inspiration thumb in place of the empty left board; suppress Load More in inspire mode.
- No DB migration. No new bucket. No new dependencies. No `config.toml` edits.

### 6. Failure / edge cases
- Wardrobe with <3 items → toast "Add a few more items first" and abort before uploading.
- Non-image file → toast "Please choose an image".
- Upload error → toast + close sheet.
- Edge function returns 402 (credits exhausted) → toast surfaces the message; sheet stays open so user can retry later.
- Edge function returns no outfits → drawer shows the existing empty state ("No suggestions found, try a different photo").
- Free-tier AI cap → handled by existing edge function error mapping (same as match-outfit).

### 7. Privacy / cleanup
Inspiration uploads land in `wardrobe-photos/${user.id}/inspiration/` and persist (same storage policy as item photos). We do **not** auto-delete because the user may want to revisit. Future enhancement (out of scope): a "clear inspirations" button in Profile.

---

## Verification checklist

- New "Recreate a Look" card appears on `/outfits` between the existing actions; tap opens the option sheet.
- Take Photo on visionOS / iOS opens the camera; Choose Photo opens the gallery (separate inputs preserved).
- After upload, drawer opens with celebratory headline, the inspiration thumb on the left of each suggestion, and the AI-built look on the right (full `OutfitPreviewBoard`).
- All `item_ids` returned by `inspire-outfit` exist in the user's wardrobe — no phantom items render.
- Saving an outfit from this flow persists to `saved_outfits` and shows up on the Outfits list.
- Hard style prohibitions hold (no suits + sneakers, etc.).
- Closing the drawer returns the user cleanly to `/outfits`; no nav side effects.
- Existing tap-an-item, occasion, and just-added flows are unchanged.

