

## Goal
Give first-time users an interactive guided tour with spotlight overlays, arrows, and step-by-step popovers that explains how to use Drip Slayer before they start building their wardrobe.

## Approach

### 1. Lightweight, dependency-free tour component
Build a custom `<OnboardingTour />` (no heavy library — keeps bundle small, matches Neon Sleek aesthetic). It will:
- Accept an ordered array of steps: `{ targetId, title, body, placement }`.
- For each step, query the DOM for `[data-tour="{targetId}"]` and:
  - Render a full-screen dark backdrop with a transparent **spotlight cutout** around the target's bounding rect (using SVG mask).
  - Render a glassmorphic popover card next to the target with title, body, **Back / Next / Skip** buttons and a step counter ("2 of 7").
  - Render an animated **arrow** pointing from the popover toward the spotlight.
- Recompute on `resize`/`scroll`; auto-scroll target into view; animate with `animate-fade-in` + `animate-scale-in`.

### 2. Tour steps (Wardrobe-first journey)
1. **Welcome** — centered modal: "Welcome to Drip Slayer 👋"
2. **Add an item** — points at "Add Item" button.
3. **Batch upload** — points at batch upload entry.
4. **Category sidebar** — "Browse and drag items between categories."
5. **Filters** — "Filter by color, pattern, texture, or tags."
6. **Outfits nav** — "Generate AI outfits once you've added items."
7. **Profile nav** — "Add your sizes for better suggestions."
8. **Done** — centered card with CTA to close.

### 3. Trigger & persistence
- Auto-show on `/wardrobe` when: authenticated AND `localStorage.ds_onboarding_completed !== "true"` AND wardrobe is empty (avoids interrupting returning users).
- On finish/skip: set the flag.
- Add a **"Replay tour"** button on Profile so users can rerun anytime.

### 4. Add `data-tour` anchors
Add unobtrusive `data-tour="..."` attributes to existing elements (no visual changes):
- `src/pages/Wardrobe.tsx` — add-item, batch upload, filter bar
- `src/components/layout/CategorySidebar.tsx` — sidebar root
- `src/components/layout/AppLayout.tsx` — Outfits + Profile nav links

### 5. Files touched / created
- **New:** `src/components/onboarding/OnboardingTour.tsx` — engine, spotlight overlay, popover, arrow
- **New:** `src/components/onboarding/tour-steps.ts` — step definitions
- **New:** `src/hooks/useOnboarding.ts` — should-show logic + localStorage + restart()
- **Edit:** `src/pages/Wardrobe.tsx` — mount tour + anchors
- **Edit:** `src/components/layout/AppLayout.tsx` — nav anchors
- **Edit:** `src/components/layout/CategorySidebar.tsx` — sidebar anchor
- **Edit:** `src/pages/Profile.tsx` — "Replay tour" button

### 6. Styling
- Backdrop: `bg-background/80 backdrop-blur-sm` with SVG spotlight cutout.
- Popover: glass card (`bg-card/90 backdrop-blur-xl border border-border/50` + elegant shadow), neon primary accent on counter & Next button.
- Arrow: animated primary-colored SVG with subtle pulse.
- Fully responsive; popover repositions to fit viewport on mobile.

## Verification checklist
- New account with empty wardrobe → tour auto-starts on `/wardrobe`.
- Click **Next** through all steps → spotlight + arrow follow each target on desktop + mobile.
- Click **Skip** → tour closes, doesn't reappear on reload.
- Resize mid-tour → overlay & popover reposition.
- Add an item, log out, log back in → tour does NOT re-trigger.
- Profile → **Replay tour** → starts again from step 1.

