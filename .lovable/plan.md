

## Goal
Add a contextual mini-tour that fires the first time a user lands on `/outfits`, explaining how the page works (mood filters, favorites, PDF export) and where to actually generate AI outfits (Wardrobe → tap an item).

## Approach

### 1. Generalize the existing tour engine
Make `OnboardingTour` and `useOnboarding` reusable across multiple tours instead of being hardcoded to one journey + one DB column.

- **`OnboardingTour.tsx`** — accept an optional `steps` prop. Default to the existing `TOUR_STEPS` so the Wardrobe call site keeps working unchanged.
  ```ts
  interface Props { open: boolean; onClose: () => void; steps?: TourStep[]; }
  ```
- **`useOnboarding.ts`** — accept an optional `tourKey: "wardrobe" | "outfits"` (default `"wardrobe"`) that maps to a column name. Same hook, same shape, just parameterized.

### 2. Database — add a second completion flag
New migration: add `outfits_tour_completed_at timestamptz` to `public.profiles` (nullable, no backfill — same pattern as the existing `onboarding_completed_at`).

The hook reads/writes whichever column matches `tourKey`. Existing RLS already covers it.

### 3. Outfits mini-tour steps
New file `src/components/onboarding/outfits-tour-steps.ts` with 4 short steps:

1. **Welcome (centered)** — "Your Saved Outfits 🎉 — here's how this page works."
2. **Mood filters** (`outfits-mood-filter`, `bottom`) — "Filter saved outfits by mood: casual, elevated, bold…"
3. **Export PDF** (`outfits-export`, `bottom`) — "Download all filtered outfits as a styled lookbook PDF."
4. **Generate more** (`nav-wardrobe`, `top`) — "To create new outfits, head back to Wardrobe and tap any item — the AI will build a complete look around it." (closing CTA: "Got it")

Empty-state and signed-out users should not trigger the tour (it'd have no anchors).

### 4. Add `data-tour` anchors
Edits in `src/pages/Outfits.tsx`:
- Wrap the mood filter row with `data-tour="outfits-mood-filter"`.
- Add `data-tour="outfits-export"` to the Export PDF button.

Edit in `src/components/layout/AppLayout.tsx`:
- Extend the existing `tourId` resolver to also tag `/wardrobe` as `nav-wardrobe` (currently only `/outfits` and `/profile` are tagged).

### 5. Wire the tour into Outfits
In `src/pages/Outfits.tsx`:
```ts
const onboarding = useOnboarding({
  userId: user?.id,
  tourKey: "outfits",
  ready: !!user?.id && outfits.length > 0, // wait until anchors render
  shouldAutoStart: !!user?.id && outfits.length > 0,
});
```
Render `<OnboardingTour open={onboarding.isOpen} onClose={onboarding.finish} steps={OUTFITS_TOUR_STEPS} />` at the bottom of the component (only when authenticated, after data loads).

Guard: do NOT auto-start if the user has zero saved outfits — they'd see the empty state instead, and the tour anchors wouldn't exist. They'll get the tour the first time they actually have something to look at.

### 6. Replay from Profile
Extend the existing "Replay tour" handler in `Profile.tsx` to clear **both** flags so users get both tours again (or split into two buttons — going with a single "Replay tours" for simplicity since they target different pages anyway).

### 7. Files touched
- **New migration** — `ALTER TABLE public.profiles ADD COLUMN outfits_tour_completed_at timestamptz;`
- **New:** `src/components/onboarding/outfits-tour-steps.ts`
- **Edit:** `src/components/onboarding/OnboardingTour.tsx` — accept optional `steps` prop
- **Edit:** `src/hooks/useOnboarding.ts` — parameterize by `tourKey`; update `restartOnboarding` to clear both columns
- **Edit:** `src/pages/Outfits.tsx` — anchors + mount tour
- **Edit:** `src/components/layout/AppLayout.tsx` — add `nav-wardrobe` tour id
- **Edit:** `src/pages/Profile.tsx` — replay clears both tours (no UI change)

## Verification checklist
- New user on `/outfits` with at least one saved outfit → mini-tour auto-starts with spotlight on mood filter, then export button, then bottom Wardrobe nav.
- Skip or finish → reload `/outfits` → tour does NOT reappear.
- Same user on Wardrobe → original onboarding tour still works independently.
- User with zero saved outfits → no tour fires (empty state shown).
- Profile → Replay tour → both Wardrobe and Outfits tours re-arm.
- RLS unaffected; only the user's own profile row is read/written.

