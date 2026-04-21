
## Goal
Tighten the dress-shirt (button-down) pairing rule so button-downs **only pair with suits**. No business-casual mixing, no sporty/casual mixing.

## Changes

### 1. `supabase/functions/_shared/dress-shirt-rules.ts`
Replace `isValidDressShirtPairing` with a stricter rule:
- If any item is a dress shirt (button-down/button-up/oxford/formal/collared), the outfit **must** include a `suits` item.
- Drop the "business casual" branch (chinos + blazer + loafers) entirely — that combo no longer satisfies the rule for dress shirts.
- Keep the existing requirement that suit + dress-shirt outfits include formal shoes and a tie/accessory.
- `isValidOutfitPairing` stays as the master validator and continues to call the updated `isValidDressShirtPairing` first.

### 2. `supabase/functions/match-outfit/index.ts`
Update the prompt rules in **both** `checkCompatibility` system prompt and the `styleRules` block used by suggestion generation:
- Replace the "TWO valid contexts" wording with a single rule: *"Dress shirts (button-downs, button-ups, oxfords, formal/collared shirts) MUST be paired with a suit, dress shoes, and a tie. Never pair a dress shirt with chinos-only outfits, joggers, hoodies, sneakers, athletic wear, graphic tees, or any casual/sporty pieces."*
- Remove the "BUSINESS CASUAL" sub-bullet for dress shirts.

### 3. No DB or UI changes needed
The validator in `match-outfit` already filters out outfits failing `isValidOutfitPairing`, so tightening the rule automatically excludes any AI suggestion that pairs a button-down with non-suit items. Compatibility check (multi-select) will also flag such manual selections as incompatible and offer swaps.

## Files touched
- `supabase/functions/_shared/dress-shirt-rules.ts` — strict rule rewrite
- `supabase/functions/match-outfit/index.ts` — prompt updates (2 spots)

## Memory update
Update `mem://features/outfits/hard-style-rules` to reflect: button-downs are suit-only; no business-casual dress-shirt context.
