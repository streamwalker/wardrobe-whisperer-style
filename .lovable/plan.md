

## Make Dress Shoes a Separate Category

Move "Dress Shoes" from being a subcategory under Shoes to its own top-level wardrobe category, so it appears as a standalone tab alongside Shoes, Pants, Tops, etc.

### Changes

**1. Update `src/lib/wardrobe-data.ts`**
- Add `'dress-shoes'` to the `WardrobeCategory` type
- Add a new entry `{ value: 'dress-shoes', label: 'Dress Shoes', icon: '👞' }` to the `CATEGORIES` array
- Remove `'dress-shoes'` from the `ShoeSubcategory` type and `SHOE_SUBCATEGORIES` array

**2. Update `src/pages/Wardrobe.tsx`**
- The new category will automatically appear as a tab since it renders from `CATEGORIES`
- Dress shoes won't need subcategory grouping since they are their own category now

**3. Update `src/pages/AddItem.tsx` and `src/components/wardrobe/EditItemDialog.tsx`**
- Add `'dress-shoes'` to the local `CATEGORIES` arrays used in the add/edit forms
- These forms already hide the subcategory selector for non-shoes/accessories categories, so dress-shoes items won't show a subcategory dropdown

**4. Update edge functions for formal detection**
- In `supabase/functions/match-outfit/index.ts`: Update `isFormalItem()` to check `item.category === "dress-shoes"` instead of `item.category === "shoes" && item.subcategory === "dress-shoes"`
- In `supabase/functions/suggest-occasion-outfit/index.ts`: Same change to `isFormalItem()`
- Update formal mode category lists from `["suits", "tops", "shoes", "accessories"]` to `["suits", "tops", "dress-shoes", "accessories"]`

**5. Migrate existing data**
- Run a database UPDATE to change any existing wardrobe items with `category = 'shoes'` and `subcategory = 'dress-shoes'` to `category = 'dress-shoes'` and `subcategory = null`

