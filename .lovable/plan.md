
# Mobile UI Optimization

## Issues Found (from mobile screenshot at 390x844)
1. **Image alt text bleeding onto cards** -- The shoe images show alt text ("Fear of God Athletics II ball Low") overlapping on top of the card, likely due to slow image loading or broken aspect-ratio containment
2. **Category tabs scrollbar visible** -- A visible green/teal scrollbar appears under the category filter pills
3. **Card info padding too generous** -- The name/color/tags section has `p-3` which wastes vertical space on mobile
4. **Bottom safe area missing** -- No `env(safe-area-inset-bottom)` for devices with home indicators (iPhone X+)
5. **Touch targets could be larger** -- The "+" button (36px) and bottom nav icons are slightly small for comfortable thumb tapping
6. **Floating selection bar positioning** -- The "Match These" bar at `bottom-6` may collide with the bottom nav on smaller screens

## Changes

### 1. WardrobeItemCard (`src/components/wardrobe/WardrobeItemCard.tsx`)
- Tighten card info padding from `p-3` to `p-2` on mobile
- Ensure image container clips overflow properly with `object-cover` and explicit sizing
- Reduce font sizes slightly for tighter mobile cards

### 2. Wardrobe Page (`src/pages/Wardrobe.tsx`)
- Hide the visible scrollbar on category tabs by adding `scrollbar-none` (already present, but ensure CSS utility exists)
- Increase bottom padding to account for bottom nav + safe area
- Move floating selection bar higher so it sits above the bottom nav (`bottom-20` instead of `bottom-6`)

### 3. AppLayout (`src/components/layout/AppLayout.tsx`)
- Add safe area padding to the bottom nav using `pb-[env(safe-area-inset-bottom)]`
- Increase main content bottom padding to prevent content from hiding behind the nav
- Make the "+" button slightly larger (40px instead of 36px) for better touch targets
- Add `viewport-fit=cover` meta tag support in the layout

### 4. Global CSS (`src/index.css`)
- Add a `.scrollbar-none` utility if not already available (hides scrollbar on WebKit and Firefox)
- Add safe area CSS custom properties for consistent spacing

### 5. Index HTML (`index.html`)
- Add `viewport-fit=cover` to the viewport meta tag for proper safe area support on iOS

### 6. OutfitSuggestionDrawer (`src/components/wardrobe/OutfitSuggestionDrawer.tsx`)
- Ensure the bottom sheet respects safe area insets at the bottom
- Tighten padding in outfit cards for mobile

### 7. AddItem Page (`src/pages/AddItem.tsx`)
- Add safe area bottom padding
- Ensure form inputs have proper touch sizing (min 44px height)

## Technical Details

**Safe area approach:**
```text
/* Bottom nav */
padding-bottom: env(safe-area-inset-bottom, 0px);

/* Viewport meta */
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

**Scrollbar hiding (CSS utility):**
```text
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
```

**Key sizing changes:**
- Card info: `p-3` to `p-2`, gap from `gap-1` to `gap-0.5`
- "+" button: `h-9 w-9` to `h-10 w-10`
- Bottom nav: `h-16` stays, add safe area inset below
- Floating bar: `bottom-6` to `bottom-20` to clear bottom nav
- Touch targets: ensure all interactive elements are at least 44px

**Files to modify:**
- `index.html`
- `src/index.css`
- `src/components/layout/AppLayout.tsx`
- `src/components/wardrobe/WardrobeItemCard.tsx`
- `src/pages/Wardrobe.tsx`
- `src/components/wardrobe/OutfitSuggestionDrawer.tsx`
- `src/pages/AddItem.tsx`
