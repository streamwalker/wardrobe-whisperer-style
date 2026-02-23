

# Compatibility Check for Multi-Select Items

## Problem
When a user selects two or more items that fundamentally clash (e.g., clashing colors or mismatched styles), the AI might force awkward outfit suggestions rather than being honest. The platform should catch these mismatches upfront and guide the user toward better pairings.

## Solution
Add an AI-powered compatibility check that runs when outfit suggestions are requested. If the selected items don't work together, the system shows a clear message explaining why and suggests alternative items from the wardrobe that would pair better.

## How It Works
1. User selects 2+ items and taps "Match These" (or the drawer opens)
2. Before generating outfits, the AI evaluates whether the selected items are compatible
3. **If compatible**: proceed as normal, show outfit suggestions
4. **If incompatible**: show an alert explaining the clash, along with thumbnail cards of suggested replacement items the user can tap to swap in

## Changes

### 1. Edge Function (`supabase/functions/match-outfit/index.ts`)
- Add a preliminary compatibility evaluation step when multiple items are selected
- Make a first AI call using a lightweight prompt: "Are these items compatible? If not, which item is the weakest link, why, and what 2-3 alternatives from the wardrobe would work better?"
- Use structured tool output with a schema like:
  ```text
  {
    compatible: boolean,
    reason: string (if incompatible),
    problem_item_id: string (the item causing the clash),
    suggested_replacements: [{ id, reason }] (2-3 better alternatives)
  }
  ```
- If compatible, proceed to the existing outfit generation logic
- If incompatible, return the validation result immediately (no outfit generation)
- Skip this check for single-item selections (they're always valid)

### 2. Drawer Component (`src/components/wardrobe/OutfitSuggestionDrawer.tsx`)
- Handle the new `compatible: false` response from the edge function
- When incompatible, show an alert card instead of outfit results:
  - A warning icon and message explaining the clash (e.g., "The Purple Pants clash with the Mustard Hoodie -- the warm mustard and cool purple create a jarring contrast")
  - A "Try these instead" section showing 2-3 alternative item thumbnails with short explanations
  - Each alternative is tappable -- tapping one swaps it into the selection and re-triggers suggestions
- Add a new `onSwapItem` callback prop so the drawer can tell the Wardrobe page to swap an item in the selection

### 3. Wardrobe Page (`src/pages/Wardrobe.tsx`)
- Pass a `onSwapItem(oldItemId, newItemId)` handler to the drawer
- When called, update `selectedItems` by replacing the old item with the new one
- The drawer will then automatically re-fetch suggestions with the updated selection

### 4. No New Dependencies
Uses the same AI gateway and edge function infrastructure already in place.

## Technical Details

**Compatibility check prompt (system):**
```text
You are StyleMatch, a fashion AI. Evaluate whether the given wardrobe items can form a cohesive outfit together. Consider color harmony, style consistency, and overall aesthetic. If any item creates a clash, identify it and suggest 2-3 alternatives from the user's wardrobe that would work better with the remaining items.
```

**New response shape from edge function:**
```text
// Incompatible response:
{
  compatible: false,
  reason: "The purple pants and mustard hoodie create a jarring warm-cool clash...",
  problem_item_id: "p9",
  suggested_replacements: [
    { id: "p4", reason: "Black pants neutralize the bold mustard" },
    { id: "p10", reason: "Khaki creates an earthy, analogous palette" }
  ]
}

// Compatible response (existing shape):
{
  compatible: true,
  outfits: [...]
}
```

**Drawer incompatibility UI layout:**
```text
+------------------------------------------+
|  (!) These items don't pair well          |
|                                           |
|  "The purple pants clash with the         |
|   mustard hoodie -- jarring contrast"     |
|                                           |
|  Try swapping [Purple Pants] for:         |
|  +--------+  +--------+  +--------+      |
|  | Black  |  | Khaki  |  | Navy   |      |
|  | Pants  |  |        |  |        |      |
|  +--------+  +--------+  +--------+      |
|  "Neutral   "Earthy     "Classic          |
|   anchor"    harmony"    pairing"         |
+------------------------------------------+
```

