

## Add Proportion & Silhouette Styling Rules to Outfit AI

### Summary
Inject comprehensive proportion-balancing rules, silhouette principles, shoe-volume matching, monochrome/vertical-line guidance, and the "Hollywood formula" into both outfit-matching edge functions so the AI considers these when building suggestions.

### Changes

**`supabase/functions/match-outfit/index.ts`** — Add a shared styling ruleset block to all system prompts (compatibility check, full outfit, multi-item, single-item modes):

Add after existing HARD STYLE RULES in each prompt:

```
PROPORTION & SILHOUETTE RULES (always apply):
- VOLUME CONTRAST: If the top is oversized/loose, the bottom must be fitted/tapered. If the bottom is wide/relaxed, the top must be fitted/structured. Never pair oversized top + baggy bottom unless going full intentional streetwear.
- THREE SILHOUETTES: Top-heavy (loose top + slim bottom), Bottom-heavy (fitted top + wide bottom), or Balanced (both moderately fitted/tailored). Every outfit must fit one of these.
- SHOE-PANT HARMONY: Slim/tapered pants → slimmer shoes (Chelsea boots, low sneakers). Wide/relaxed pants → chunkier shoes (boots, chunky sneakers). Mismatched shoe-pant volume ruins proportions.
- MONOCHROME ADVANTAGE: When possible, favor outfits in one color family (head to toe) for a taller, leaner look. Avoid high-contrast color breaks at the waist.
- VERTICAL STRUCTURE: Prefer items that create vertical lines (structured lapels, front-creased trousers, long coats) for a lengthening effect.
- POWER FORMULA: Structured jacket + fitted shirt + tapered trousers + substantial footwear = the most universally flattering combination. Prioritize this when the wardrobe supports it.
- 3-4 COLOR MAXIMUM: Keep each outfit to 3-4 total colors. Fewer colors = more intentional and confident.
- STREETWEAR EXCEPTION: Full oversized (top + bottom + chunky shoes) is acceptable ONLY when all three pieces are intentionally exaggerated and the style tags indicate streetwear/sporty.
```

**`supabase/functions/suggest-occasion-outfit/index.ts`** — Add the same proportion rules block to the system prompt, so occasion-based suggestions also respect these principles.

### No other files change
The wardrobe data model already has `category`, `style_tags`, and item names which give the AI enough signal to apply these rules. No new database columns, filters, or UI changes are needed.

