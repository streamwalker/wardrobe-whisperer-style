

## Goal
Allow **floral polos** and **short-sleeve button-ups** to pair with suits — currently the rule engine blocks polos with suits entirely, and short-sleeve button-ups are treated as full dress shirts (which require a tie + dress shoes, blocking smart suit pairings).

## Approach

### 1. Recognize "short-sleeve button-up" as a distinct category
In `supabase/functions/_shared/dress-shirt-rules.ts`, add a helper `isShortSleeveButtonUp(item)` that matches keywords like `"short sleeve"`, `"short-sleeve"`, `"camp collar"`, `"cuban collar"`, `"resort shirt"` combined with button-up hints.

Then update `isDressShirt(item)` to **exclude** short-sleeve variants — a short-sleeve shirt is no longer a "formal dress shirt" requiring tie + dress shoes. This frees it from the strict `isValidDressShirtPairing` requirement (which mandates suit + dress shoes + tie).

### 2. Allow polos and short-sleeve button-ups with suits
In `isValidOutfitPairing(items)`:
- **Remove** the line `if (hasPolo && hasSuit) return false;` — polos (including floral) are now allowed under a suit (modern smart-casual tailoring).
- **Keep** the existing polo restrictions against dress shoes, joggers, and hoodies (these still don't make sense).
- Short-sleeve button-ups, no longer flagged as dress shirts, automatically pass through `isValidDressShirtPairing` and can pair freely with suits, sneakers (smart-casual), boots, etc. — the same lane as polos.

### 3. Update the client-side hint
In `src/lib/dress-shirt-hint.ts`:
- Mirror the same "exclude short-sleeve" logic in `isDressShirt` so the missing-pieces nudge ("add a suit, dress shoes, and a tie") only fires for true long-sleeve dress shirts. Floral polos and short-sleeve button-ups won't trigger the formal-completion hint.

### 4. Files touched
- `supabase/functions/_shared/dress-shirt-rules.ts` — add `isShortSleeveButtonUp`, refine `isDressShirt`, drop polo-with-suit prohibition in `isValidOutfitPairing`.
- `src/lib/dress-shirt-hint.ts` — mirror the short-sleeve exclusion so the UI hint stays in sync.

No DB or UI component changes — purely rule-engine logic.

## Verification checklist
- Select a floral polo + a suit + dress shoes → outfit validates (previously blocked).
- Select a short-sleeve button-up + a suit + sneakers → outfit validates as smart-casual.
- Select a long-sleeve white dress shirt without a suit → still blocked, hint still shows "add a suit, dress shoes, and a tie".
- Polo + joggers, polo + hoodie, polo + dress shoes → still blocked (unchanged).
- Run existing `match-outfit/index.test.ts` — long-sleeve dress shirt rules unaffected.

