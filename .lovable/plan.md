

## Goal
Block the rule engine from ever pairing a **tie** with a **polo** shirt. The screenshot shows "Tropical Nightfall" generating a polo + floral silk tie combination, which is sartorially invalid (polos have no collar stand or button placket designed for a tie).

## Approach

### 1. Detect ties as a distinct accessory
In `supabase/functions/_shared/dress-shirt-rules.ts`, add a helper:

```ts
export function isTie(item: WardrobeItem): boolean {
  if (item.category !== "accessories") return false;
  const text = toSearchText(item);
  return hasAnyKeyword(text, ["tie", "necktie", "bow tie", "bowtie", "silk tie"]);
}
```

### 2. Add a polo-vs-tie prohibition in `isValidOutfitPairing`
Right alongside the existing polo restrictions (no dress shoes, no joggers, no hoodies), add:

```ts
const hasTie = items.some((i) => isTie(i));
if (hasPolo && hasTie) return false;
```

This guarantees the post-generation validator rejects any AI suggestion that combines a polo with any tie variant (necktie, bow tie, silk tie).

### 3. Reinforce in the AI prompt
In `supabase/functions/match-outfit/index.ts` (and `suggest-occasion-outfit/index.ts` if it has its own prompt), add an explicit rule line to the styling guidelines passed to the model:
> "Never pair a polo shirt with a tie of any kind — polos have no collar stand for a tie."

This reduces wasted retries by steering the model away from the combo upfront, while the validator above is the hard guarantee.

### 4. Files touched
- `supabase/functions/_shared/dress-shirt-rules.ts` — add `isTie` helper, add polo+tie prohibition to `isValidOutfitPairing`.
- `supabase/functions/match-outfit/index.ts` — add the rule to the system prompt.
- `supabase/functions/suggest-occasion-outfit/index.ts` — same prompt addition if it generates outfits independently.

No DB or UI changes — purely rule-engine + prompt logic.

## Verification checklist
- Generate outfits including a polo in the wardrobe → no result includes a tie.
- Manually select polo + suit + tie → outfit fails validation.
- Long-sleeve dress shirt + suit + tie → still validates (unchanged).
- Polo + suit + dress shoes (no tie) → still validates (smart-casual lane preserved).

