

## Add Wardrobe Filters (Color Tone + Style)

### Overview
Add a filter bar below the existing category tabs that lets you filter items by **color tone** (Dark, Light, Neutral) and **style** (Casual, Sporty, Minimal, Bold, Luxury, Neutral). Filters work alongside the existing category tabs.

### How It Works
- A row of toggle chips appears below the category tabs
- Two filter groups: **Tone** (Dark / Light / Neutral) and **Style** (Casual / Sporty / Minimal / Bold / Luxury)
- Multiple filters can be active at once (e.g., "Dark" + "Casual")
- Items must match ALL active filters (AND logic)
- A small "Clear filters" button appears when any filter is active

### Color Tone Classification
Items will be classified by their `color_hex` brightness (luminance):
- **Dark**: luminance below 40% (blacks, navys, dark greens)
- **Light**: luminance above 70% (whites, creams, light grays)  
- **Neutral**: luminance between 40-70% (tans, mid-grays, olives)

### Technical Details

**File: `src/lib/wardrobe-data.ts`**
- Add a `getColorTone(hex: string)` utility function that computes relative luminance and returns `"dark" | "light" | "neutral"`
- Export `STYLE_FILTERS` and `TONE_FILTERS` arrays for the UI

**File: `src/pages/Wardrobe.tsx`**
- Add state: `activeTones` (Set of tone values) and `activeStyles` (Set of style tag values)
- Add a filter bar section between the category tabs and the item grid
- Filter chips rendered as toggle buttons with active/inactive styling (same pill style as category tabs)
- Update the `filtered` logic to apply tone + style filters on top of category filtering
- Add a "Clear filters" text button when filters are active

The filter bar will use the same rounded-pill chip styling as the existing category tabs for visual consistency. No new dependencies or database changes needed -- this is purely a client-side filter on existing data.

