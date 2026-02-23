
# Fix: Full-Outfit Selection Returns Duplicate Suggestions

## Problem
When you select one item from each of the 4 categories (shoes, pants, tops, outerwear), the outfit engine has zero remaining categories to vary. It returns 3 "suggestions" that are all the same items with different names -- a hallucination.

## Solution
Detect when all 4 categories are covered by the selection and switch to an **alternative variation mode**: instead of filling empty categories, the AI suggests outfits that swap out one item at a time to show different styling directions while keeping the core look.

## Changes

### `supabase/functions/match-outfit/index.ts`

**1. Detect full-outfit selection**
After building `grouped` (available items by category), check if `grouped` has zero categories to fill (i.e., every category already has an anchor).

**2. Use a different prompt for full-outfit mode**
Instead of "fill remaining categories," the prompt becomes:
- "The user selected a complete outfit. Suggest 3 variations by swapping exactly ONE item for a better alternative from the same category. Each suggestion should take the outfit in a different styling direction (e.g., bolder shoes, lighter pants, different outerwear). Explain why the swap improves or changes the look."

**3. The tool schema stays the same**
Each suggestion still returns `name`, `item_ids` (4 items), `explanation`, and `mood` -- so the UI needs no changes.

### No frontend changes needed
The drawer already renders whatever the backend returns. As long as each suggestion has different `item_ids`, it will display correctly.

## Technical Details

The key code change in the edge function (around line 150-212):

```text
// After building grouped categories...
const missingCategories = ['shoes', 'pants', 'tops', 'outerwear']
  .filter(cat => !anchorCategories.includes(cat));

if (missingCategories.length === 0) {
  // Full outfit selected -- use variation prompt
  // Prompt asks AI to swap exactly 1 item per suggestion
  // to create 3 distinct variations
}
```

The variation prompt will instruct the AI to:
- Keep 3 of the 4 items intact in each suggestion
- Swap a different item each time (or the same item with different replacements)
- Explain how the swap changes the outfit's character
- Never return the original selection unchanged
