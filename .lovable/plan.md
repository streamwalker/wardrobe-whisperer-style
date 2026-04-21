

## Goal
After a user uploads an inspiration photo on the **Outfits page** (the "Recreate a Look" flow we just shipped), let them tap a new **"Generate Complete Look"** button on any AI suggestion to:

1. Take that suggested outfit (a mix of pieces from their wardrobe — and conceptually inspired by something they don't yet own).
2. **Auto-generate 1–2 missing "hero" pieces** that would complete the look but aren't in their wardrobe (e.g. *"a cream oversized cable knit"* the inspiration had but they're missing).
3. Show the **full composed look**: existing wardrobe pieces + newly generated concept pieces, side-by-side, with a **short stylist rationale** explaining why the combination works.

This bridges the gap between "here's a look from what you own" and "here's what you'd need to truly recreate it" — a natural extension of the inspire flow that keeps users engaged with their gaps in a positive, generative way.

---

## Approach

### 1. New edge function: `complete-look`
Create `supabase/functions/complete-look/index.ts`. It:

1. Accepts `{ outfit: { name, item_ids, explanation, mood }, wardrobeItems: WardrobeItemLite[], inspirationImageUrl?: string }`.
2. Calls Lovable AI Gateway (`google/gemini-2.5-flash`, structured tool-calling) to:
   - Examine the outfit's existing items + (optional) inspiration image.
   - Identify **0–2 missing categories** that would make the look truly complete (e.g. outerwear if it's a cold-weather vibe, accessories to elevate it). Hard cap at 2 to keep things tasteful.
   - For each missing piece, return a structured "concept piece": `{ category, name, primary_color, color_hex, style_tags, pattern, texture, description, image_prompt }`.
   - Also returns a refined `rationale` (2–3 sentences) explaining how the existing + concept pieces work together (volume, color, formality), reusing the `styling-principles` memory.
3. For each concept piece, calls Lovable AI **image generation** (`google/gemini-2.5-flash-image`) with the `image_prompt` + a fixed style suffix ("clean studio shot, neutral background, e-commerce style, no model") to produce a single garment image.
4. Returns `{ rationale, conceptPieces: [{ ...metadata, imageUrl: dataUrlOrStoredUrl }] }`. Images come back as base64 data URLs from the gateway — we return them directly to keep the function stateless (no storage upload needed for ephemeral previews).
5. CORS, Zod validation, 402/429 mapping — same pattern as the other functions.
6. Enforces hard style rules from `_shared/dress-shirt-rules.ts` so the AI can't propose, e.g., suit shoes for a casual sneaker look.
7. `verify_jwt` stays at the project default — no `config.toml` change.

### 2. New component: `CompleteLookView.tsx`
`src/components/wardrobe/CompleteLookView.tsx` — a presentational sub-view rendered inside the existing `OutfitSuggestionDrawer` when the user taps "Generate Complete Look" on a suggestion card.

Layout:
- Header: outfit name + mood badge.
- **Composed look strip**: a horizontal scroll of all pieces (existing wardrobe items first with their photos; concept pieces second with a small **"Concept"** chip overlay on each tile).
- **Stylist rationale** card below: gradient border, italic body copy, ~3 sentences.
- Two CTAs at the bottom:
  - **Save this look** — saves only the wardrobe portion to `saved_outfits` (concept pieces aren't real items, so they're skipped) with the rationale captured in `explanation`.
  - **Back** — returns to the suggestions list within the drawer.

We do **not** auto-add concept pieces to the wardrobe (they're aspirational). A small "Want this piece? Add it from Shop" hint on each concept tile points users to the existing Shop flow as a soft upsell.

### 3. Drawer integration (`OutfitSuggestionDrawer.tsx`)
- Add a `Sparkles` "Generate Complete Look" button to each suggestion card's footer (next to the existing "Save" button).
- Local drawer state `completingOutfit: OutfitSuggestion | null`. When set, the drawer body swaps from the suggestions list to `<CompleteLookView outfit={completingOutfit} ... />`.
- While the edge function runs: show an in-card spinner with "Composing your complete look…" — image generation can take ~5–10s for two pieces.
- "Back" clears `completingOutfit` and restores the list view.
- Available in **all three drawer modes** (anchor item, occasion, inspiration) — no mode gating; the feature is universally useful.

### 4. Concept piece data model (client-side only)
Add a lightweight `ConceptPiece` type in `src/lib/wardrobe-data.ts`:
```ts
export interface ConceptPiece {
  category: WardrobeCategory;
  name: string;
  primary_color: string;
  color_hex: string;
  style_tags: StyleTag[];
  pattern?: string;
  texture?: string;
  description: string;
  imageUrl: string; // base64 data URL from gateway
  isConcept: true;
}
```
This stays out of the DB — concept pieces are render-only, never persisted.

### 5. Save behavior
When the user hits "Save this look" from `CompleteLookView`:
- Insert into `saved_outfits` with `item_ids` = only the existing wardrobe item ids (concept pieces excluded), `name` = outfit name, `mood` = outfit mood, `explanation` = the new AI-generated `rationale` (richer than the original).
- Toast: "Saved! Concept pieces aren't saved — explore them in Shop."
- Do **not** close the drawer — let the user keep exploring other suggestions.

### 6. Files touched

- **New:** `supabase/functions/complete-look/index.ts` — outfit completion + image generation.
- **New:** `src/components/wardrobe/CompleteLookView.tsx` — composed look view + rationale + save.
- **Edit:** `src/components/wardrobe/OutfitSuggestionDrawer.tsx` — "Generate Complete Look" button per card; conditional render of `CompleteLookView`.
- **Edit:** `src/lib/wardrobe-data.ts` — add `ConceptPiece` type.
- No DB migration. No new bucket. No new dependencies. No `config.toml` edits.

### 7. Failure / edge cases
- AI returns 0 missing pieces → show the rationale + just the wardrobe pieces (still a valid composed view; rationale is the value-add).
- Image generation fails for one piece → render that tile as a styled placeholder card with the description text + small "image unavailable" note; the rest of the look still shows.
- 402 (credits exhausted) → toast surfaces the message; user is returned to the suggestions list.
- 429 (rate limit) → toast "Too many requests, try again in a moment".
- Hard rule violation in AI output → server-side validator drops the offending concept piece before returning.
- Save with all concept pieces and no real items → button disabled with tooltip "Need at least one real wardrobe piece to save".

### 8. Performance / cost notes
- We cap concept pieces at 2 to bound image-gen latency (~5–10s total) and Lovable AI credit usage.
- Image generation runs sequentially server-side (Gemini image model handles one at a time) but we kick off the text rationale call in parallel with the first image to shave a beat off perceived latency.
- No caching layer in v1 — each "Generate Complete Look" tap is a fresh call. If users complain about repeat costs we can add an in-memory per-session cache later.

---

## Verification checklist

- "Generate Complete Look" button appears on every AI suggestion card across all three drawer modes (anchor, occasion, inspiration).
- Tapping it shows the loading state, then renders the composed look + rationale within ~10s.
- Existing wardrobe pieces show their real photos; concept pieces show generated images with a clear "Concept" chip.
- Rationale reads naturally and references concrete styling principles (volume, color, formality).
- "Save this look" stores only real items into `saved_outfits` and the new outfit appears on `/outfits` with the richer rationale as `explanation`.
- "Back" returns cleanly to the suggestions list; closing the drawer doesn't leak loading state.
- Hard style prohibitions hold (no suits + sneakers, no concept dress shoes paired with athletic looks, etc.).
- Free-tier AI cap (402) and rate limits (429) surface friendly toasts; the drawer stays usable.

