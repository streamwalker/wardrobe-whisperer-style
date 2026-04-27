## Goal
Apply consistent LCARS page chrome — `LcarsHeader` + `LcarsFrame` "sector" layout — to every route so the entire app reads as one continuous LCARS console (not just `AppLayout`).

## Architecture

Pages fall into **two groups** which need different treatment:

### Group A — In-shell pages (rendered through `AppLayout` `<Outlet/>`)
Already inherit the top LCARS bar, sidebar, and bottom nav. They only need an inner `LcarsHeader` + `LcarsFrame` "sector" wrap around their existing content:
- `Wardrobe.tsx` — sector "WARDROBE OPS"
- `Outfits.tsx` — sector "STYLE LIBRARY"
- `Profile.tsx` — sector "CREW DOSSIER"
- `Shop.tsx` — sector "ACQUISITIONS"
- `Pricing.tsx` — sector "TIER UPGRADE"
- `AddItem.tsx` — sector "SPECIMEN INTAKE"
- `BatchAddItems.tsx` — sector "BATCH UPLINK"

### Group B — Standalone pages (NOT inside `AppLayout`)
These render bare today. They need a **new shared shell** that draws a minimal LCARS top bar + ticker + frame so they don't break the aesthetic:
- `Auth.tsx` — sector "AUTHORIZATION"
- `TermsOfService.tsx` — sector "DIRECTIVE 010"
- `PrivacyPolicy.tsx` — sector "DIRECTIVE 011"
- `SharedWardrobe.tsx` — sector "GUEST ACCESS"
- `NotFound.tsx` — sector "RED ALERT" (red color scheme, pulsing red bar)

## New components

### `src/components/lcars/LcarsSection.tsx` (NEW)
A thin wrapper combining `LcarsHeader` + `LcarsFrame` so every page calls one component:
```tsx
<LcarsSection title="WARDROBE OPS" subtitle="SECTOR 01" code="47-8615"
  topColor="orange" sideColor="lavender" bottomColor="salmon">
  {children}
</LcarsSection>
```
- Picks colors per-page so each route feels distinct (image-2 / image-4 vibrancy).
- Uses `lcarsCode(title)` for stable serial numbers when none is passed.
- Exposes optional `rightSlot` for page-level pill actions (e.g., Wardrobe's "Generate"/"Share"/"Transfer" buttons relocated into the header strip).

### `src/components/lcars/LcarsStandaloneShell.tsx` (NEW)
Renders the same top "Drip Slayer NCC-1701-D" pill bar + serial ticker that `AppLayout` uses, then renders an `LcarsSection` containing the page. Used by Group B pages so visitors landing on `/auth`, `/terms`, `/shared/...` see the same console framing as the rest of the app. Includes:
- Black bg, scanline overlay (`bg-mesh`)
- Optional back-link pill (e.g., legal pages get a "← AUTH" pill)
- Bottom serial ticker
- No bottom nav (those routes are unauthenticated / context-free)

## Per-page edits

### `Wardrobe.tsx`
- Replace the existing `<h2>{wardrobeTitle}</h2>` + actions row with `<LcarsSection title={wardrobeTitle.toUpperCase()} subtitle="SECTOR 01" code={lcarsCode(user?.id)}>`.
- Move the action button row into the `rightSlot` for ≥ md screens; below md it stays as a horizontal scroll strip beneath the header (preserves existing mobile UX).

### `Outfits.tsx`
- Wrap return blocks (loading / signed-out / empty / list) each in `<LcarsSection title="STYLE LIBRARY" topColor="salmon" sideColor="lavender" bottomColor="cyan">`.
- Move "Export PDF" button into the `rightSlot` as an `LcarsPill`.

### `Profile.tsx`
- Wrap content in `<LcarsSection title="CREW DOSSIER" topColor="cyan" sideColor="lavender" bottomColor="orange">`.
- Place "Logout" pill in `rightSlot`.

### `Shop.tsx`
- Wrap in `<LcarsSection title="ACQUISITIONS" topColor="lavender" sideColor="peach" bottomColor="salmon">`.

### `Pricing.tsx`
- Wrap in `<LcarsSection title="TIER UPGRADE" topColor="yellow" sideColor="orange" bottomColor="red">` to highlight monetization.

### `AddItem.tsx` / `BatchAddItems.tsx`
- Replace their current `<ArrowLeft>` + `<h1>` header with `LcarsSection` whose `rightSlot` holds a back pill ("← OPS").

### `Auth.tsx`
- Drop the gradient blob decorations (legacy "Neon Sleek").
- Wrap with `<LcarsStandaloneShell title="AUTHORIZATION" topColor="orange">`.
- Convert the inner card to use existing LCARS-themed `Input`/`Button` primitives (no extra work — they're already overridden).

### `TermsOfService.tsx` / `PrivacyPolicy.tsx`
- Wrap with `<LcarsStandaloneShell title="DIRECTIVE 010" code="DIR-010-…">`.
- Replace the `<ArrowLeft>` ghost button with an `LcarsPill side="l" color="cyan">← AUTH</LcarsPill>` placed in the shell's rightSlot.

### `SharedWardrobe.tsx`
- Wrap with `<LcarsStandaloneShell title={`${ownerName.toUpperCase()} • GUEST ACCESS`} topColor="cyan">`.

### `NotFound.tsx`
- Wrap with `<LcarsStandaloneShell title="RED ALERT — SECTOR NOT FOUND" topColor="red" sideColor="yellow" bottomColor="red">` and reuse the existing pulse animation defined in `index.css`.

## Deliverables / Files

**Created:**
- `src/components/lcars/LcarsSection.tsx`
- `src/components/lcars/LcarsStandaloneShell.tsx`

**Edited (header swap only — body content untouched):**
- `src/pages/Wardrobe.tsx`
- `src/pages/Outfits.tsx`
- `src/pages/Profile.tsx`
- `src/pages/Shop.tsx`
- `src/pages/Pricing.tsx`
- `src/pages/AddItem.tsx`
- `src/pages/BatchAddItems.tsx`
- `src/pages/Auth.tsx`
- `src/pages/TermsOfService.tsx`
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/SharedWardrobe.tsx`
- `src/pages/NotFound.tsx`

## Out of scope (next round)
- Photo "Viewscreen" treatment on `WardrobeItemCard` / `ZoomableImage`
- Replacing in-page filter chips with full LCARS pill chips
- Per-page registry dashboards (live ship-status sub-bar)

These are queued so this PR stays focused on the chrome wrap.