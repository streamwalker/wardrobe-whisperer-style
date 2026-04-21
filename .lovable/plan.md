

## Goal
Add an animated arrow that visually connects each tour popover to its spotlighted element, making it instantly clear which UI element the current step is describing.

## Approach

### 1. Compute arrow geometry inside `OnboardingTour.tsx`
We already know both rectangles per step:
- **Popover rect**: derived from `pos.top`, `pos.left`, fixed `POPOVER_WIDTH`, and an estimated height.
- **Spotlight rect**: the existing `spotlight` object (target bounding rect + padding).

For each step where a target exists (i.e. not `placement: "center"`), pick:
- **Arrow start** = the edge of the popover facing the target (e.g. for `placement: "bottom"` the arrow leaves from the popover's top-center).
- **Arrow end** = the closest edge midpoint of the spotlight rect facing the popover.

Skip rendering the arrow when `placement === "center"` (welcome / done steps have no target).

### 2. Render a curved SVG arrow
Add a second full-screen `<svg>` layer (above the spotlight backdrop, below the popover) containing:
- A quadratic Bézier `<path>` from start → end with a control point offset perpendicular to the line (gives a soft curve, not a straight stab).
- An `<defs><marker>` arrowhead at the end, filled with `hsl(var(--primary))`.
- Stroke uses `hsl(var(--primary))`, width `2.5`, with `filter: drop-shadow(0 0 8px hsl(var(--primary) / 0.7))` for the neon glow that matches the spotlight ring.

### 3. Animations (Tailwind + inline keyframes)
Two layered effects, both purely CSS so we don't need new tailwind config:
- **Draw-in on step change**: animate `stroke-dashoffset` from the path's total length down to 0 over ~450ms with `ease-out`. Reset on every step by keying the `<path>` with `step.id` so React remounts it.
- **Continuous pulse**: a subtle `animate-pulse` on the path (or a custom inline `@keyframes` that oscillates `opacity` between 0.7 and 1 every 1.6s) so the arrow keeps drawing the eye without being distracting.

Arrowhead marker gets a tiny inline `transform: scale()` pulse via the same keyframe (optional — only if it reads well; otherwise leave the head static).

### 4. Pointer-events & z-index
- The arrow `<svg>` uses `pointer-events: none` so it never blocks clicks on Skip / Next / the popover.
- Z-index sits between the backdrop SVG and the popover (existing `z-10` on the popover stays the topmost interactive layer).

### 5. Files touched
- **Edit only:** `src/components/onboarding/OnboardingTour.tsx`
  - Add `computeArrowPath(popoverRect, spotlight, placement)` helper.
  - Render new `<svg>` layer with `<defs><marker></defs>` and animated `<path>`.
  - Add a small inline `<style>` block (or reuse `animate-pulse`) for the dash-draw keyframe.

No new files, no config changes, no changes to `tour-steps.ts`, hooks, or anchors.

## Verification checklist
- Steps 2–7 (with targets) show a glowing curved arrow from the popover edge to the spotlight ring.
- Steps 1 & 8 (centered welcome / done) render with no arrow.
- Advancing Next/Back re-draws the arrow from scratch each time.
- Resizing the window keeps the arrow attached to both endpoints.
- Arrow never intercepts clicks on Skip, Next, Back, or the highlighted element.
- Visual style matches the existing primary/neon palette and spotlight glow.

