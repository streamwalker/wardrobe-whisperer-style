

## Formal Outfit Pairing Mode

When you select any "formal" item -- a suit, a dress shirt, dress shoes, or a tie -- the outfit matcher will switch to a formal-only mode that pairs exclusively within these four categories instead of the usual casual categories (shoes/pants/tops/outerwear).

### What Changes

**1. Add "Dress Shoes" subcategory**
- Add `'dress-shoes'` to the `ShoeSubcategory` type and `SHOE_SUBCATEGORIES` array in `src/lib/wardrobe-data.ts`
- The add/edit forms already support shoe subcategories, so dress shoes will appear automatically in the dropdown

**2. Define formal item detection logic (in the edge function)**
- An item is "formal" if:
  - Its category is `suits`
  - Its category is `accessories` (ties/belts -- accessories are formal by nature in this wardrobe)
  - Its category is `tops` AND its name contains "Dress Shirt"
  - Its category is `shoes` AND its subcategory is `dress-shoes`

**3. Update `match-outfit` edge function for formal pairing**
- When ANY anchor item is detected as formal, switch to a "formal outfit" mode
- The formal outfit has 4 slots: **Suit + Dress Shirt + Dress Shoes + Tie**
- Filter `wardrobeItems` to only include formal items before sending to the AI
- Update the AI system prompts to describe the 4 formal categories instead of shoes/pants/tops/outerwear
- Update `allCategories` from `["shoes", "pants", "tops", "outerwear"]` to `["suits", "tops", "shoes", "accessories"]` when in formal mode

**4. Update the occasion outfit function**
- Update `supabase/functions/suggest-occasion-outfit/index.ts` with the same formal detection and filtering logic so occasion-based suggestions also respect formal pairing

### How It Works (example flow)

1. User selects a Navy Two-Button Suit
2. Edge function detects `category === "suits"` -- formal mode activates
3. Only dress shirts (tops with "Dress Shirt" in name), dress shoes (shoes with subcategory "dress-shoes"), and ties (accessories) are sent to the AI
4. AI returns 3 outfit suggestions each containing: 1 suit + 1 dress shirt + 1 pair of dress shoes + 1 tie

### Technical Details

**`src/lib/wardrobe-data.ts`**
- Add `'dress-shoes'` to `ShoeSubcategory` type and `SHOE_SUBCATEGORIES` constant

**`supabase/functions/match-outfit/index.ts`**
- Add `isFormalItem(item)` helper function with the detection rules above
- Add `isFormalMode` check: `const isFormalMode = anchors.some(a => isFormalItem(a))`
- When `isFormalMode`:
  - Filter `wardrobeItems` to only formal items
  - Use formal categories `["suits", "tops", "shoes", "accessories"]` instead of casual ones
  - Update system prompts to describe formal outfit structure (Suit + Dress Shirt + Dress Shoes + Tie)
  - Update compatibility check prompts similarly

**`supabase/functions/suggest-occasion-outfit/index.ts`**
- Add same `isFormalItem` helper and filtering logic for occasion-based suggestions

