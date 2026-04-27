## Goal
Replace the current "Neon Sleek" glassmorphism look across **every page and subpage** with a faithful **Star Trek: Picard–era LCARS** UI: black background, vivid color blocks (orange, red, peach, lavender, cyan, salmon), pill-and-elbow shapes, sci‑fi serial numbers, and the iconic Antonio/Okuda-style typography. Reference the six uploaded panels for color ratios (image 2 and 4 = peak saturation), elbow shapes (image 1), color-coded blocks (image 3), and red-alert state (image 4 & 6).

## Strategy: token-first reskin

The app already routes ~25 components through a small set of shared utilities (`glass-card`, `neon-gradient-cyan-pink`, `bg-mesh`, `font-display`, etc.) plus shadcn primitives. By **redefining those tokens and utilities** in `tailwind.config.ts` and `src/index.css`, the entire app picks up the LCARS look automatically. We then layer in **structural LCARS chrome** at the layout level (`AppLayout`, `CategorySidebar`) for the signature elbow frame.

---

## 1. Design system foundation

### 1a. `src/index.css` — LCARS color palette + typography
Replace the current HSL token block with the canonical LCARS palette (Picard era):

- `--background: 0 0% 0%` (true black — the LCARS substrate)
- `--foreground: 30 100% 70%` (LCARS off‑white/peach text)
- `--lcars-orange: 28 100% 55%` — primary block color
- `--lcars-red: 4 85% 55%` — alert/destructive
- `--lcars-peach: 24 100% 75%` — secondary block
- `--lcars-salmon: 12 80% 65%`
- `--lcars-lavender: 260 60% 70%`
- `--lcars-violet: 285 55% 60%`
- `--lcars-blue: 210 100% 65%`
- `--lcars-cyan: 195 90% 55%`
- `--lcars-yellow: 45 100% 60%`
- Map `--primary` → orange, `--accent` → cyan, `--destructive` → red, `--card` → `0 0% 6%`, `--muted` → `0 0% 12%`, `--border` → `28 100% 55% / 0.4`

Swap fonts:
- Replace Outfit + Cormorant Garamond Google import with **Antonio** (closest free analog to Microgramma/Helvetica Compressed used in LCARS) for headings + numerals, and **Inter** or **Barlow Condensed** for body.
- Update `tailwind.config.ts` `fontFamily.display` → Antonio, `fontFamily.sans` → Barlow Condensed, add `fontFamily.mono` → JetBrains Mono for the serial-number ticker text.
- Add a `.lcars-numerals` utility (Antonio, tabular-nums, tracking-wider) for the ubiquitous `47‑8615`, `03‑0490` style codes.

### 1b. Rewrite shared utility classes (so every existing consumer inherits LCARS)

| Old class | New behavior |
|---|---|
| `.glass-card` | Solid black panel with a thick **left bar of `--lcars-orange`** and rounded-only-on-the-corner-that-matches-the-frame. No blur, no translucency. |
| `.glass-panel` | Same but using `--lcars-lavender` for hierarchy variation. |
| `.glass-input` | Black field with orange 1px frame; on focus, frame becomes cyan and a small `[FIELD: ACTIVE]` label appears via `::after`. |
| `.neon-gradient-cyan-pink` | Becomes flat `--lcars-orange` (no gradients in LCARS). Buttons stay vivid via solid color blocks. |
| `.neon-glow` / `.neon-glow-box` | No-op or subtle 1px outer ring in matching LCARS color. |
| `.bg-mesh` | Pure black background with subtle scanline overlay (`repeating-linear-gradient` 1px every 3px at 4% opacity). |
| `.hover-lift` | Replace lift with a brief flash to peach + brightness pulse (LCARS "selected" feedback). |

### 1c. New LCARS-only utilities

- `.lcars-pill-l` / `.lcars-pill-r` — `border-radius: 9999px 0 0 9999px` (and mirror) for the half-stadium endcaps used everywhere.
- `.lcars-elbow-tl`, `.lcars-elbow-tr`, `.lcars-elbow-bl`, `.lcars-elbow-br` — implemented with two stacked divs (a horizontal bar + a vertical bar joined by a `border-radius: 60px 0 0 0` corner) to recreate the iconic L-shaped frame from images 1 and 4.
- `.lcars-bar` — colored solid block, height `h-6`, used as a divider/header element.
- `.lcars-tick` — short black gap inserted into a colored bar (the small "notch" seen across the frames).
- `.lcars-screen` — wrapper that applies a subtle CRT vignette + scanlines.
- `.lcars-blink-red` — keyframe pulsing red+white for any "Condition Red" state (used on errors / destructive confirmations like the existing `DeleteItemPopover`).

---

## 2. App shell — `AppLayout.tsx` and `CategorySidebar.tsx`

Restructure into a true LCARS frame (matches images 1, 4, 6):

- **Top bar**: a single horizontal LCARS bar split into colored segments — `[ORANGE PILL: DRIP SLAYER ⌁ NCC‑1701‑D]` on the left, segmented colored blocks in the middle (each block carries a serial number like `47‑8615` rendered in `.lcars-numerals`), and a right pill with the user/profile/theme toggle. The "Pro" badge becomes a yellow LCARS pill labelled `LCARS ⌁ TIER 02`.
- **Left elbow frame**: convert `CategorySidebar` into the canonical LCARS L: a thick orange/lavender vertical column flowing into a top horizontal bar via a rounded elbow. Each category is rendered as a stacked **half-pill button** (flat color, uppercase Antonio label, numeric prefix like `01 — TROUSERS`). Active = peach with black text; inactive = lavender. Add tiny "system code" labels under each (e.g., `VAL‑0421`).
- **Bottom navigation**: convert into a horizontal LCARS bar with four oversized colored pills (`WARDROBE / SHOP / OUTFITS / PROFILE`), each with its own LCARS color. Active pill flashes peach.
- **Add (+) menu**: becomes a circular red pill labelled `+ INPUT` opening an LCARS-styled panel.
- **Light-mode toggle**: re-label as `ALPHA / BETA SHIFT` (image 2) — keeps the existing theme function but reframes it.
- **Page wrapper**: wrap `<Outlet/>` in `.lcars-screen` so every page sits inside subtle scanlines + a 4-corner elbow frame.

## 3. shadcn primitive overrides

Edit the variants in shared shadcn files so the rest of the app inherits LCARS automatically — no per-page edits needed beyond the layout.

- **`src/components/ui/button.tsx`**: rewrite `cva` variants:
  - `default` → orange LCARS pill (`rounded-full`, `bg-lcars-orange`, `text-black`, `font-display uppercase tracking-widest`).
  - `destructive` → red LCARS pill with `.lcars-blink-red` on hover.
  - `outline` → black with orange border + left half-pill.
  - `secondary` → lavender pill.
  - `ghost` → transparent; on hover, fills peach.
  - `neon` (legacy) → aliased to `default` so `OutfitSuggestionDrawer` etc. keep working.
  - `glass` (legacy) → aliased to `outline`.
  - Sizes: keep `sm/default/lg/icon` but change `rounded-md` → `rounded-full` everywhere; `icon` becomes a perfect circle.
- **`dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `command.tsx`**: swap `bg-background`/`border` defaults for an LCARS modal frame — black panel with an orange top bar containing a serial ID + a red `× DISMISS` pill in the corner. Override only the wrapper class strings; internals stay shadcn.
- **`input.tsx` / `textarea.tsx` / `select.tsx`**: black field, orange 1px border, peach text, uppercase placeholder, focus ring becomes cyan.
- **`tabs.tsx`**: list becomes a row of LCARS pills (active tab = peach, inactive = lavender). Already used by `OutfitSuggestionDrawer` (Board / Compare).
- **`toggle.tsx` / `toggle-group.tsx`**: pill cluster with hard color states. Powers the existing density toggle (Compact/Full) without further edits.
- **`slider.tsx`**: track becomes a thin orange bar with peach fill; thumb becomes a tall narrow lavender rectangle (matches LCARS faders in image 2).
- **`switch.tsx`**: rectangular pill, off = lavender, on = orange.
- **`badge.tsx`**: solid LCARS color blocks with serial-number text.
- **`progress.tsx`**: horizontal stack of orange tick blocks (10 segments) instead of a smooth bar — matches the bar meters in image 1.
- **`tooltip.tsx`** & **`sonner.tsx` / `toast.tsx`**: black with orange left bar + a `LCARS ⌁ MSG` header pill.
- **`scroll-area.tsx`**: scrollbar becomes a thin orange track with a peach thumb.

## 4. Photo & image treatment (the creative core)

The user explicitly asked for inventive ways to incorporate photos in the LCARS aesthetic. Apply these consistently anywhere a wardrobe item, outfit board, or thumbnail is rendered.

### 4a. `WardrobeItemCard.tsx` — "Specimen Display"
- Wrap each photo in an LCARS frame: orange L-elbow on the top-left corner, lavender bar on the right, colored "TAG" pill at the bottom-left containing the item name + a fake registry code (e.g., `SPN‑${item.id.slice(0,4).toUpperCase()}`).
- Apply a subtle **CRT scanline + cyan tint overlay** (mix-blend-multiply 8%) so photos look like they're displayed on a viewscreen.
- Hover: brief peach corner flash + a `[ANALYZING…]` ticker line at the bottom.
- The existing per-card "Match" sparkle button (recently added) becomes a circular cyan pill labelled `⌁ MATCH`.

### 4b. `ZoomableImage` + Dialog — "Viewscreen Mode"
- The zoom dialog becomes a full LCARS viewscreen: black, orange elbow border, top bar reading `MAGNIFICATION ${zoom}x ⌁ SUBJECT ${item.name}`, four colored corner blocks with serial numbers, and a bottom row of `+ / − / RESET / DISMISS` LCARS pills replacing the implicit gestures (gestures still work).
- Add a subtle reticle (thin cyan crosshair, 20% opacity) over the image while dragging.

### 4c. `OutfitPreviewBoard.tsx` — "Tactical Composition"
- Re-skin each zone tile: every tile gets a left-side colored stripe whose color encodes the category (top=orange, bottom=lavender, shoes=red, accessory=cyan, outerwear=yellow). This mirrors the color-coded EPS panels in image 3.
- The 2x3 grid background becomes the LCARS frame with bar headers `ZONE ${idx} / ${categoryName}`.
- Compact density renders smaller pills; full density renders larger viewscreens — both already wired through props.

### 4d. Photo upload (`AddItem.tsx`, `BatchAddItems.tsx`) — "Sensor Capture"
- File pickers become an LCARS panel titled `SENSOR INPUT — VISUAL`. Two big pills: red `📷 CAPTURE LIVE` and lavender `🗂 LIBRARY UPLINK` (preserving the existing visionOS dual-trigger requirement from project memory).
- During upload + AI analysis, replace the spinner with a horizontal scanning line moving over the photo plus an LCARS header reading `ANALYZING SUBSPACE SIGNATURE…` and a 10-segment progress bar.
- On success, emit a brief peach flash + `[ANALYSIS COMPLETE — TAGS WRITTEN]` ticker.
- Batch grid: each tile gains a serial number and a small status pill (`PENDING / ANALYZING / ✓ FILED`).

### 4e. `Shop.tsx` — "External Database Query"
- The shop link/URL input becomes a long LCARS data-entry pill with an orange `> SCAN` button on the right. Results render as LCARS specimen cards identical to the wardrobe treatment.

## 5. Page-by-page touches (low-effort because tokens cascade)

For each of these pages, the only edits needed are: replace ad-hoc `font-display` headings with an `<LcarsHeader title="…" code="…" color="orange|lavender|cyan" />` helper component (new — `src/components/lcars/LcarsHeader.tsx`), wrap the page in an `<LcarsFrame>` (new — adds the four-corner elbow), and swap any remaining one-off gradients/glow classes for LCARS equivalents.

- **`Wardrobe.tsx`**: header pill `WARDROBE INVENTORY ⌁ ${count} SPECIMENS`. Filter chips become LCARS pills.
- **`Outfits.tsx`**: header `OUTFIT COMPOSITIONS`. Existing `data-tour` anchors (mood filter, export) preserved.
- **`Profile.tsx`**: rendered as an LCARS personnel file — left column lavender bar with `OFFICER FILE`, measurements as a tabular LCARS readout. Sign-out becomes red LCARS pill.
- **`Pricing.tsx`**: tier cards become LCARS panels — Free = lavender, Pro = orange, with serial codes and segmented feature blocks (image 1 vibe).
- **`Auth.tsx`**: full-screen LCARS login viewer titled `LCARS ⌁ AUTHENTICATION REQUIRED`, two pill toggles for Sign In / Sign Up, social buttons as colored pills.
- **`SharedWardrobe.tsx`**: header `GUEST ACCESS ⌁ TOKEN VERIFIED`.
- **`TermsOfService.tsx` / `PrivacyPolicy.tsx`**: black LCARS document panel with orange section dividers; numbered sections in `.lcars-numerals`.
- **`NotFound.tsx`**: red-alert LCARS screen — pulsing `CONDITION RED ⌁ SECTOR NOT FOUND ⌁ ROUTE: ${path}` (image 4 / 6 styling).
- **`CookieConsent.tsx`**: LCARS bottom panel with orange/lavender pills.

## 6. Special LCARS micro-interactions

- **Red Alert state** (`NotFound`, destructive confirmations, edge-function 503 errors that already surface as toasts): full-screen 1px red border that pulses, a top bar reading `ALERT ⌁ CONDITION RED`, plus the `.lcars-blink-red` animation. Wire into existing toast for `503` errors so the runtime error users currently see becomes an in-character message: `SUBSPACE LINK DEGRADED — RETRY`.
- **Boot sequence** (first render only, ~600ms): black screen → orange bar wipes left-to-right with `LCARS 03‑0490 ⌁ INITIALIZING` → fades into the app. Stored in `sessionStorage` so it only plays once per session.
- **Number ticker**: small `LcarsTicker` component renders a slowly-cycling stream of serial numbers across the bottom of the header (purely decorative, animated via CSS).

## 7. Light mode handling

LCARS is canonically dark. We will:
- Keep the existing theme toggle (`next-themes`) but **rebrand** it as `ALPHA SHIFT / BETA SHIFT`.
- Light mode = "BETA SHIFT" — same LCARS colors but on a very light cream background (40 30% 95%) with darker color blocks (image 2 has hints of this). The structure is identical; only the substrate inverts.
- Default remains dark per existing behavior.

## 8. Files touched

**Tokens / utilities**
- `tailwind.config.ts` — fonts, color tokens, keyframes (`lcars-blink-red`, `lcars-scan`, `lcars-boot`).
- `src/index.css` — full token rewrite, new `.lcars-*` utilities, font swap, scanline overlay.

**App shell**
- `src/components/layout/AppLayout.tsx` — full LCARS frame rewrite.
- `src/components/layout/CategorySidebar.tsx` — elbow frame + half-pill category buttons.

**New LCARS primitives**
- `src/components/lcars/LcarsHeader.tsx`
- `src/components/lcars/LcarsFrame.tsx` (4-corner elbow wrapper)
- `src/components/lcars/LcarsPill.tsx`
- `src/components/lcars/LcarsTicker.tsx`
- `src/components/lcars/LcarsScanOverlay.tsx`
- `src/components/lcars/LcarsBoot.tsx` (one-shot boot animation)

**shadcn overrides** (variant rewrites only — keep behavior)
- `button.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `command.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `tabs.tsx`, `toggle.tsx`, `toggle-group.tsx`, `slider.tsx`, `switch.tsx`, `badge.tsx`, `progress.tsx`, `tooltip.tsx`, `sonner.tsx`, `toast.tsx`, `scroll-area.tsx`.

**Photo experiences**
- `WardrobeItemCard.tsx`, `DraggableItemCard.tsx`, `OutfitPreviewBoard.tsx`, `OutfitCompareView.tsx`, `OutfitSuggestionDrawer.tsx`, `OccasionOutfitDrawer.tsx`, `CompleteLookView.tsx`, `ZoomableImage.tsx` host (Dialog wrapper).

**Pages** (light edits — wrap in `LcarsFrame`, swap headings to `LcarsHeader`)
- `Wardrobe.tsx`, `Outfits.tsx`, `Profile.tsx`, `Pricing.tsx`, `Auth.tsx`, `SharedWardrobe.tsx`, `TermsOfService.tsx`, `PrivacyPolicy.tsx`, `NotFound.tsx`, `Shop.tsx`, `AddItem.tsx`, `BatchAddItems.tsx`.

**Misc**
- `CookieConsent.tsx`, `OnboardingTour.tsx` (re-skin tooltip cards), `WardrobeMatchTip.tsx`.

## 9. What we will NOT change

- Routing, data flow, Supabase queries, edge functions, RLS, AI behavior — purely visual/structural.
- Component APIs (props of shadcn primitives stay the same so no consumer breaks).
- Existing `data-tour` anchors used by the onboarding tour.
- Memory rules: dark default, separate camera/library triggers, RLS PERMISSIVE, etc. — all preserved.

## Acceptance criteria
- Every page renders inside an LCARS elbow frame on a true-black background, with Antonio uppercase headings and serial-number metadata.
- Buttons, inputs, dropdowns, tabs, sliders, switches, toasts, and dialogs all show the LCARS pill/block aesthetic — no remaining glassmorphism, no remaining cyan↔pink gradients.
- The wardrobe, outfit board, zoom dialog, and shop photo experiences use the LCARS "viewscreen" treatment (corner elbows, scanline overlay, registry codes, scan animations).
- The 503 / error states render as a Red Alert. The first session render plays the boot sequence once.
- Light mode still works (renamed Alpha/Beta Shift) and remains visually LCARS.
- All existing functionality (selection, drag & drop, AI match, density toggle, compare view, missing-pieces callout, onboarding tour, sharing, transfers, freemium gating) continues to work unchanged.