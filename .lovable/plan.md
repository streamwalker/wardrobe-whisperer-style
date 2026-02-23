
# Wardrobe Column Layout by Category

## Problem
When viewing "All" items, everything is in one flat grid. Users have to scroll past all shoes, then all pants, etc. It's hard to see items across categories at a glance.

## Solution
When "All" is selected, display items organized into **category columns** side by side. Each column has a category header (e.g. "Shoes", "Pants", "Tops", "Outerwear") with its items stacked vertically underneath. This lets you scan across all categories without scrolling.

When a specific category tab is selected, keep the current single grid layout since you're only viewing one category.

## Layout (mobile, "All" view)

```text
+----------+----------+----------+----------+
| Shoes    | Pants    | Tops     | Outerwear|
+----------+----------+----------+----------+
| [card]   | [card]   | [card]   | [card]   |
| [card]   | [card]   | [card]   | [card]   |
| [card]   | [card]   | [card]   | [card]   |
|          | [card]   |          | [card]   |
|          | [card]   |          |          |
|          | ...      |          |          |
+----------+----------+----------+----------+
```

On mobile (390px), this will be a **2-column layout** with two category columns per row (Shoes + Pants on top, Tops + Outerwear below). On larger screens (sm+), all 4 categories sit side by side.

Each column scrolls independently so you can see all items per category.

## Changes

### `src/pages/Wardrobe.tsx`
- When `activeCategory === "all"`, render a new **column-based layout**:
  - Group items by category using the `CATEGORIES` array
  - Render a 2-column grid (mobile) / 4-column grid (desktop)
  - Each column has a sticky category header (icon + label + count)
  - Items are stacked vertically within each column
- When a specific category is selected, keep the existing 2-column card grid
- The category columns will each show items in a single-column stack so cards are taller and easier to see

### No other files need to change
- `WardrobeItemCard` stays the same
- All selection logic, floating bar, and drawer remain unchanged
