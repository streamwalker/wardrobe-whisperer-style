## Goal

The current LCARS theme nails the **TNG era** (warm orange/peach/lavender on black). The new reference images are clearly **Star Trek: Picard / USS Titan / Enterprise-G era** — cooler, darker, denser, and far more "instrumentation panel" than "color blocks". This plan retunes the existing theme rather than rebuilding it: same primitives, restyled to match.

### Visual diff vs. current build

| Aspect | Current (TNG) | Target (Picard / Titan) |
|---|---|---|
| Dominant chrome | Orange + lavender + peach blocks | **Slate gray-blue** rails with sparse orange/red accents |
| Backgrounds | Pure black + scanlines | Black + faint **dotted grid** (image 2) |
| Numeric chips | A few colored pills | Dense **stacks of `XX-XXX`** in muted gray-blue |
| Panel borders | Thick solid color blocks (left bar) | **Thin double-stroke rounded** outlines (image 4 alert frame, image 2 EPS) |
| Photo viewer | Corner brackets only | **Reticle + grid + bottom letter scale** (image 2 Morganogram) |
| Theme toggle | 2-state Alpha/Beta | **Tri-shift** Alpha / Beta / Gamma (image USS_Titan_2-2) |
| Alert state | Pulsing red border on NotFound | Full **"ALERT: CONDITION RED"** chrome wrapper available everywhere (image Red_Alert-2) |
| Tickers | Single marquee row | Marquee + **dotted "tick rows"** above/below panels |

Nothing is removed — existing LCARS colors stay in the palette so warm accents still appear, but they're demoted to highlights instead of base color.

---

## 1. Palette refit (`src/index.css`, `tailwind.config.ts`)

Add a **Titan / Picard** color band alongside the existing LCARS tokens. These become the new defaults for chrome; the current orange/peach/lavender stay available for accents and emphasis.

New tokens (HSL):
- `--titan-slate: 215 18% 28%` — primary panel fill
- `--titan-steel: 212 22% 42%` — lighter panel fill  
- `--titan-frost: 210 30% 70%` — light text on dark slate (pill labels)
- `--titan-rail: 218 16% 18%` — sidebar / chip rail base
- `--titan-grid: 210 30% 50% / 0.10` — dotted grid color
- `--titan-teal: 188 60% 55%` — primary accent (replaces cyan as default highlight)
- `--titan-amber: 24 90% 60%` — warm accent (sparingly, for active/select)
- `--titan-alert: 4 88% 56%` — Red Alert (already exists as `--lcars-red`, kept)

Update **dark theme defaults** so:
- `--background` stays black
- `--foreground` shifts from peach (`30 100% 78%`) to **frost** (`210 30% 78%`)
- `--border` uses `--titan-steel` at 0.4 alpha instead of orange
- `--ring` becomes `--titan-teal`
- `--sidebar-background` becomes `--titan-rail` (not pure black) so the L-shape sidebar reads as a stainless-steel rail like image 1

Add `titan` color group to Tailwind (`titan-slate`, `titan-steel`, `titan-frost`, `titan-rail`, `titan-teal`, `titan-amber`).

**Why:** Keeps the entire `lcars-*` namespace working (every existing component continues to render) while giving the chrome a Picard-era weight.

---

## 2. New utility classes (`src/index.css`)

Add to `@layer utilities`:

- `.bg-grid` — black background + dotted grid overlay (`background-image: radial-gradient(hsl(var(--titan-grid)) 1px, transparent 1px); background-size: 18px 18px;`). Replaces `bg-mesh` on `AppLayout` and `LcarsStandaloneShell`.
- `.lcars-frame-rounded` — the **thin double-stroke rounded box** seen in image 4 (alert) and image 2 (EPS): `border: 1px solid hsl(var(--titan-steel)); border-radius: 22px; outline: 1px solid hsl(var(--titan-steel) / 0.35); outline-offset: 4px;`
- `.lcars-tick-row` — the dotted strip seen at top of image 2 (`••• •••• ••`): repeating `radial-gradient` of small dots in `titan-frost / 0.55`, height `8px`.
- `.lcars-chip` — slate pill used in side rails: `background: hsl(var(--titan-steel)); color: hsl(var(--titan-frost)); padding: 2px 10px; border-radius: 4px; font: tabular-nums 'Antonio';`. Variants `.lcars-chip--amber`, `.lcars-chip--teal`, `.lcars-chip--alert`.
- `.lcars-reticle` — overlay used inside `lcars-viewscreen`: SVG-style crosshair (center cross + corner brackets via existing `::before/::after` already there) **plus** vertical `0..90` ladder on the right and a horizontal `S.T. / S.B. / J.M. / M.F. / L.V.` label strip on the bottom.
- `.condition-red` — wrapper class that applies a **2px solid red border**, a faint red inner glow, and renders a sticky "ALERT: CONDITION RED" header bar via `::before`. Pulses subtly (existing `lcars-blink-red` keyframe).

**`bg-mesh` is repurposed**, not deleted — points at `bg-grid` so existing pages get the new background for free.

---

## 3. New / updated primitives (`src/components/lcars/LcarsPrimitives.tsx`)

Add three new exports. Existing `LcarsHeader`, `LcarsFrame`, `LcarsPill`, `LcarsTicker`, `LcarsCodeChip` keep their signatures (all consumers untouched), but their internal styling shifts to slate:

- **`LcarsHeader`** — title bar background changes from `bg-black border-y border-lcars-orange/30` to `bg-titan-rail border-y border-titan-steel/40`; title color from `text-lcars-peach` to `text-titan-frost`. `color` prop still cycles the endcaps so callers passing `headerColor="cyan"` etc. keep working — bright accents still appear, just on a cooler base.
- **`LcarsFrame`** — gains an optional `variant?: "blocks" | "rounded"` prop (default `"blocks"`). `"rounded"` renders `.lcars-frame-rounded` instead of the colored top/bottom strips, matching image 4 and image 2. Existing pages stay on `"blocks"` unless we opt them in.
- **`LcarsCodeChip`** — adds `variant?: "block" | "slate"` (default `"slate"` going forward). Slate variant uses `.lcars-chip` so dense rails look like the Titan EPS panel.

New components:

- **`LcarsChipRail`** — a vertical column of `LcarsCodeChip` items. Used on Wardrobe / Outfits sidebars to fill empty space with the dense Picard look. Props: `codes: string[]`, `accentEvery?: number` (every Nth chip becomes amber/teal).
- **`LcarsLevelGauge`** — a vertical 0–100 meter with tick marks and an orange/red fill wedge (image 1, image 3). Props: `value: number; max?: number; label?: string; tone?: "amber" | "alert" | "teal"`. Used on Profile (e.g., wardrobe fullness toward free-tier limit) and Pricing (subscription tier indicator).
- **`LcarsAlertBanner`** — full-width `ALERT: CONDITION RED` strip (image 4) with optional `title` and `subtitle`. Used by `NotFound`, error toasts, and any future "tier limit reached" warning.
- **`LcarsTickRow`** — thin `••••` dot strip; placed above / below `LcarsHeader` and at the bottom of `LcarsStandaloneShell`.

`lcarsCode()` helper unchanged.

---

## 4. App shell update (`src/components/layout/AppLayout.tsx`)

Re-skin without changing structure:

- Header strip background: `bg-titan-rail` (not pure black), with a `LcarsTickRow` sitting **above** the existing marquee — matches the dotted bar at the top of image 2.
- Mid-bar segments switch from peach/lavender/salmon to **slate-steel/frost**, with a single amber chip and one teal chip for accent (matches image USS_Titan_2-2 mid-area).
- Replace the 2-state Alpha/Beta toggle with a **tri-segment shift selector**:
  - `[ALPHA SHIFT]` (dark) — sets `theme="dark"`
  - `[BETA SHIFT]` (light) — sets `theme="light"`
  - `[GAMMA SHIFT]` (dim) — sets `theme="dark"` + adds a `gamma-shift` class on `<html>` that tones down brightness via a CSS filter (`filter: brightness(0.85) hue-rotate(-8deg)`). Stored in `localStorage` so it persists.
  - Visual matches the three-block strip in image USS_Titan_2-2: amber/frost/teal blocks with the active one outlined.
- Bottom nav: keep the four colored pills but add a small `LcarsCodeChip` per item (e.g., `47-8615`) so they read like instrument buttons; add a `LcarsTickRow` directly above the nav.

Sidebar (`CategorySidebar.tsx`):
- Background switches to `bg-titan-rail`.
- Each category button keeps its color cycle but is **smaller and flatter**, with a `LcarsCodeChip` (slate) on the right showing the category's serial code. Active state goes from `ring-white` to a thicker amber left bar — closer to the active row in image 1.
- Append a `LcarsChipRail` of ~10 random codes below the categories so the empty space matches the data-dense Titan rails.

---

## 5. Standalone shell (`src/components/lcars/LcarsStandaloneShell.tsx`)

- Top bar restyled identically to `AppLayout` (slate, tick rows, amber/teal accents).
- Body wrapped in `LcarsFrame variant="rounded"` instead of the current colored block frame, so legal/auth pages read like image 2 / image 4 panels.
- Add a `LcarsTickRow` at the very bottom of the shell.

---

## 6. Photo viewscreen upgrade

`src/components/wardrobe/ZoomableImage.tsx`:
- Wrap the existing `<img>` container in a new overlay div carrying `.lcars-reticle`.
- Render an SVG overlay with: center crosshair + 4 corner brackets (already there) + right-side `0..90` ladder + bottom letter strip `S.T. · S.B. · J.M. · M.F. · L.V.` (matches image 2 Morganogram exactly).
- Add a small top-left `MORGANOGRAM SCAN · {code}` label using the item's `lcarsCode(item.id)`.
- The reticle is purely decorative (`pointer-events-none`) so existing pinch / pan / wheel behavior is unchanged.

`WardrobeItemCard.tsx`:
- Card border switches from neon-cyan-on-hover to **titan-steel base + amber on hover/select**, matching the slate aesthetic.
- The "selected" check pill becomes a slate `LcarsCodeChip` with a checkmark + the item's serial code.
- A tiny `lcars-tick-row` runs across the top of each card (1px tall) so a grid of cards reads like a console.

---

## 7. Pages — opt-in Picard chrome

Each page already wraps its body in `LcarsSection`. Rather than touching every page individually, we just retune `LcarsSection` defaults:

- Default `headerColor` stays `"orange"` (so warm accent persists) but `topColor` / `bottomColor` defaults shift to slate variants. Pages that pass explicit colors keep their current vibrant frames.
- `LcarsSection` gains an optional `variant?: "blocks" | "rounded"` forwarded to `LcarsFrame`. We opt **Profile, Pricing, TermsOfService, PrivacyPolicy, Auth** into `"rounded"` because they're text-heavy panels (matches image 2). **Wardrobe, Outfits, Shop, AddItem** stay on `"blocks"` so the colorful TNG energy remains where the photo content lives.
- `LcarsSection` also gains an optional `tickRows?: boolean` (default true) that renders `LcarsTickRow` above the header and below the bottom strip.

`NotFound.tsx`:
- Replace the manual red-pulse styling with a top-level `LcarsAlertBanner title="ALERT: CONDITION RED" subtitle="SECTOR NOT FOUND"` plus `condition-red` wrapper around the body — pixel-faithful to image 4.

---

## 8. Boot sequence (`LcarsBoot.tsx`)

Tweak (not rebuild):
- Replace single orange progress bar with a **tri-bar** (slate / amber / teal) that fills sequentially.
- Add three lines of `lcars-mono` boot text:
  - `LCARS 03-0490 ⌁ INITIALIZING SUBSPACE LINK`
  - `U.S.S. TITAN NCC-80102-A ⌁ SENSOR ARRAYS NOMINAL`
  - `STARDATE {random} ⌁ ALPHA SHIFT ENGAGED`

Still session-scoped, still plays once.

---

## 9. Files involved

**Edited:**
- `src/index.css` — add `titan-*` tokens, `.bg-grid`, `.lcars-frame-rounded`, `.lcars-tick-row`, `.lcars-chip`, `.lcars-reticle`, `.condition-red`; retune dark-theme defaults
- `tailwind.config.ts` — add `titan` color group
- `src/components/lcars/LcarsPrimitives.tsx` — restyle `LcarsHeader` + `LcarsFrame` + `LcarsCodeChip`; add `LcarsChipRail`, `LcarsLevelGauge`, `LcarsAlertBanner`, `LcarsTickRow`
- `src/components/lcars/LcarsSection.tsx` — add `variant` + `tickRows` props
- `src/components/lcars/LcarsStandaloneShell.tsx` — adopt rounded variant + tick rows
- `src/components/lcars/LcarsBoot.tsx` — tri-bar + multi-line readout
- `src/components/layout/AppLayout.tsx` — slate chrome, tri-shift toggle, tick rows, code chips on bottom nav
- `src/components/layout/CategorySidebar.tsx` — slate rail, slate chips, append `LcarsChipRail`
- `src/components/wardrobe/ZoomableImage.tsx` — reticle / grid / scale overlay
- `src/components/wardrobe/WardrobeItemCard.tsx` — slate borders, code chip on select
- `src/pages/NotFound.tsx` — adopt `LcarsAlertBanner` + `condition-red` wrapper
- `src/pages/Profile.tsx` + `src/pages/Pricing.tsx` — opt into `variant="rounded"`; Profile gains a `LcarsLevelGauge` for wardrobe-capacity-vs-free-tier
- `src/pages/TermsOfService.tsx`, `src/pages/PrivacyPolicy.tsx`, `src/pages/Auth.tsx` — pass `variant="rounded"`

**New:** none — all additions live inside `LcarsPrimitives.tsx`.

---

## 10. Backward compatibility

- Every existing `lcars-*` token, utility class, and primitive prop remains. Components that hard-code `bg-lcars-orange` etc. continue to render exactly as before — they just sit on a cooler base background, which matches the reference images (warm pills against slate rails).
- No route changes, no data changes, no DB migrations.
- Tri-shift (Gamma) is additive: if a user's saved preference is the existing `dark` or `light`, it Just Works.

---

## Open question

The reference images show two distinct vibes: image 1/3 (heavy slate sidebar + amber accents, "bridge console") and image 4 (Condition Red alert). This plan defaults to the **bridge-console** look at all times and surfaces Condition Red only on `NotFound` and via `LcarsAlertBanner`. If you'd rather have a manual "RED ALERT" toggle in the header that paints the whole app red (great for stress-testing or a fun easter egg), say the word and I'll add it to the tri-shift selector as a fourth state.