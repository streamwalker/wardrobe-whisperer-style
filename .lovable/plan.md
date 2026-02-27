

## Add Trend-Aware Outfit Suggestions

### Overview
Enhance the outfit suggestion system to incorporate current fashion trends, so suggestions reflect what's popular and trending right now -- not just color theory and wardrobe compatibility.

### How It Works
1. **New "Trending" edge function** (`fetch-fashion-trends`) uses an AI model with web search (Perplexity) to gather current fashion trends -- popular color palettes, styling patterns, and outfit themes for the current season.
2. **Inject trend context** into the existing `match-outfit` and `suggest-occasion-outfit` edge functions so the AI stylist considers trends when building outfits.
3. **"Trending" toggle** on the Wardrobe page and Occasion drawer lets users opt into trend-aware suggestions. When enabled, the app fetches fresh trend data and passes it to the outfit AI.
4. **Trend badge** on outfit cards shows when a suggestion was influenced by current trends.

### Architecture

```text
User taps "Suggest Outfits" with Trending ON
        |
        v
Frontend calls fetch-fashion-trends edge function
        |
        v
Edge function calls Perplexity (sonar) for current trends
        |
        v
Trend summary returned to frontend
        |
        v
Frontend passes trend context to match-outfit / suggest-occasion-outfit
        |
        v
AI stylist factors trends into outfit picks
```

### Technical Details

**1. Connect Perplexity Connector**
- Perplexity is available as a standard connector. We'll connect it to get the `PERPLEXITY_API_KEY` secret for the edge function.

**2. New Edge Function: `supabase/functions/fetch-fashion-trends/index.ts`**
- Calls Perplexity's `sonar` model with a prompt like: "What are the top men's/women's fashion trends for [current season] [current year]? Include trending color palettes, popular outfit styles, and key pieces."
- Returns a concise trend summary string (cached per session on the frontend to avoid redundant calls).
- Register in `supabase/config.toml` with `verify_jwt = false`.

**3. Update `supabase/functions/match-outfit/index.ts`**
- Accept an optional `trendContext` string in the request body.
- If provided, append a `CURRENT FASHION TRENDS` section to the system prompt so the AI considers trending styles, colors, and combinations when making suggestions.

**4. Update `supabase/functions/suggest-occasion-outfit/index.ts`**
- Same approach: accept optional `trendContext` and inject into the system prompt.

**5. Update `src/components/wardrobe/OutfitSuggestionDrawer.tsx`**
- Add a "Trending" toggle chip (e.g., a small switch or pill button with a flame/trend icon).
- When enabled, fetch trend data from the new edge function before calling `match-outfit`, and pass the result as `trendContext`.
- Cache the trend data in component state so repeat suggestions don't re-fetch.

**6. Update `src/components/wardrobe/OccasionOutfitDrawer.tsx`**
- Add the same "Trending" toggle near the weather section.
- Pass `trendContext` to the `suggest-occasion-outfit` function when enabled.

**7. UI indicator on outfit cards**
- When trend context was used, show a small "Trending" badge on the outfit card (reuse existing Badge component).

### What Changes

| File | Change |
|------|--------|
| Perplexity connector | Connect via `connect` tool |
| `supabase/functions/fetch-fashion-trends/index.ts` | New -- fetches trend data via Perplexity |
| `supabase/config.toml` | Register new function |
| `supabase/functions/match-outfit/index.ts` | Accept + use optional `trendContext` in prompts |
| `supabase/functions/suggest-occasion-outfit/index.ts` | Accept + use optional `trendContext` in prompts |
| `src/components/wardrobe/OutfitSuggestionDrawer.tsx` | Add trending toggle, fetch trends, pass context |
| `src/components/wardrobe/OccasionOutfitDrawer.tsx` | Add trending toggle, fetch trends, pass context |

### Notes
- Trend data is fetched once per session and cached client-side to minimize API calls.
- The toggle defaults to OFF so existing behavior is unchanged unless the user opts in.
- No database changes needed.
