

## Add Proportion, Silhouette, Pattern & Texture Styling Rules to Outfit AI

### Summary
The outfit-matching edge functions now include comprehensive proportion-balancing rules, silhouette principles, shoe-volume matching, monochrome/vertical-line guidance, the "Hollywood formula", **and pattern/texture assessment rules** so the AI considers all of these when building suggestions.

### Pattern & Texture Rules Added
- Pattern mixing limits (max 2 patterned items, must differ in scale)
- Pattern + solid anchoring guidance
- Texture contrast for visual interest
- Texture-formality matching
- Seasonal texture awareness
- Pattern formality alignment

### Files Changed
- `supabase/functions/match-outfit/index.ts` — All 5 prompt sections (compatibility, full-outfit, multi-item, single-item) updated with pattern & texture rules
- `supabase/functions/suggest-occasion-outfit/index.ts` — System prompt updated with pattern & texture rules
