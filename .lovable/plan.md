

## Goal
When the AI suggests an outfit in the `OutfitSuggestionDrawer`, render a **live visual preview** that composes the suggested pieces into a single "look" image alongside the user's currently selected wardrobe pieces — so users immediately see how the outfit visually comes together instead of just reading a list of thumbnails.

## Current state
`OutfitSuggestionDrawer` already renders each suggested outfit as a horizontal scroll of small ~80px tiles plus a text explanation. Selected items aren't shown next to the suggestion — the user has to mentally connect the AI's pick back to what they tapped.

## Approach

### 1. New `OutfitPreviewBoard` component
A flat-lay style visual composition that arranges items in a fashion-app layout (top-row outerwear/tops, mid-row bottoms, bottom-row shoes/accessories). Pure CSS grid + image tiles — no canvas, no extra deps.

**Layout zones** (driven by `category`):
```text
┌─────────────────────────────┐
│   [Outerwear]  [Top]        │  ← row 1
│                             │
│        [Bottom]             │  ← row 2 (centered, larger)
│                             │
│   [Shoes]   [Accessory]     │  ← row 3
└─────────────────────────────┘
```
- Each tile = item photo on its color-tinted background (reuses existing `color_hex` fallback pattern).
- Empty zones collapse gracefully — outfits without outerwear just don't render that slot.
- Aspect-square container, ~280px tall on mobile, scales on desktop via `sm:` breakpoint.
- Subtle neon ring around the whole board (`shadow-neon` token already in the project) to match brand.

### 2. Side-by-side comparison view
Inside each suggestion card in `OutfitSuggestionDrawer`, replace the current single horizontal thumb strip with a **two-column comparison** when there are user-selected anchor items:

```text
┌──────────────────┬──────────────────┐
│  YOUR PICK(S)    │  SUGGESTED LOOK  │
│   [board]        │    [board]       │
└──────────────────┴──────────────────┘
```

- Left board = the `items` prop (what the user tapped).
- Right board = the full suggested outfit (`outfit.item_ids` mapped through `allWardrobeItems`).
- Items shared between both sides get a small "✓ kept" badge on the right board so users see what was preserved vs. what the AI added.
- On mobile (<640px) the two boards stack vertically with a small "↓" divider; on desktop they sit side-by-side with a vertical divider.
- The existing tiny thumbnail strip is removed (redundant with the new boards).

### 3. Files touched
- **New:** `src/components/wardrobe/OutfitPreviewBoard.tsx` — the flat-lay composition component. Props: `items: WardrobeItem[]`, `highlightSharedIds?: string[]`, `label?: string`.
- **Edit:** `src/components/wardrobe/OutfitSuggestionDrawer.tsx`
  - Import the new board.
  - Inside the outfit card render loop, replace the small thumb strip with the two-column comparison (`YOUR PICK(S)` vs `SUGGESTED LOOK`).
  - Compute `sharedIds = items.map(i => i.id).filter(id => outfit.item_ids.includes(id))` per outfit and pass to the right board for the "kept" badge.
- No changes to the edge function, hooks, DB, or anchors.

### 4. Visual polish
- Both boards share the same fixed height so they line up.
- Item tiles use `rounded-xl`, `border border-white/10`, hover lift via `transition-transform hover:scale-[1.03]` (desktop only).
- "Kept" badge: small green-cyan pill in the top-right of the tile using existing `Badge` with `variant="secondary"` + custom class.
- Empty zone placeholders show a faint dashed outline with the zone label ("Top", "Bottom", "Shoes") in muted text — keeps the grid balanced visually even if a slot is empty.

## Verification checklist
- Tap a single item → drawer opens → each suggestion shows the user's pick on the left and the full suggested look on the right; shared items carry a "Kept" badge.
- Tap multiple items → left board renders all picks correctly across zones.
- Outfit without outerwear → that zone collapses or shows the dashed placeholder, no broken layout.
- Mobile width → boards stack vertically with the divider; desktop → side-by-side.
- Incompatibility branch (`incompatible !== null`) is unchanged — still shows the existing replacement-suggestion UI.
- Save / Load More / Skip flows still work; performance stays smooth (images are already lazy-loaded).

