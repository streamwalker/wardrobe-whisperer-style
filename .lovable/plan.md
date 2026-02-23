

# Smarter Outfit Matching: Always 3 Complete Outfits

## Overview
Upgrade the AI matching engine so tapping ANY item (shoes, pants, tops, or outerwear) always returns exactly 3 complete outfit suggestions. Each outfit will include one item from every category -- shoes, pants, a shirt, and a hoodie/jacket -- along with color theory explanations for why the combination works.

## What Changes

### 1. Update the AI Prompt (Backend Function)
**File: `supabase/functions/match-outfit/index.ts`**
- Change the system prompt to explicitly require **exactly 3 outfits**, each containing one item from every category (shoes, pants, tops, outerwear)
- Emphasize that the selected item is the anchor and the AI must pick the best match from each remaining category
- Example: tapping Mustard Hoodie should return 3 outfits, each with a specific pair of shoes, pants, and shirt that complement the mustard color
- Update the tool schema minimum items from 2 to 3

### 2. Update the User Prompt
- Restructure the user prompt to group available items by category so the AI clearly sees what's available in each category
- This helps the AI pick one item per category more reliably

### 3. No Frontend Changes Needed
The drawer already displays outfit cards with thumbnails for all included items -- it will automatically show the full outfit (4 items per card) once the AI returns them.

## Technical Details

- The `suggest_outfits` tool schema `items` array will have `minItems: 3, maxItems: 3`
- Each outfit's `item_ids` must include the selected item plus one item from each of the other 3 categories
- The system prompt will list the 4 categories explicitly and instruct the AI to always cover all of them
- Available items in the user prompt will be grouped by category for clarity
