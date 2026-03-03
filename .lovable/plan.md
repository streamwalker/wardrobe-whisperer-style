

## UI/UX Refresh: Modern, Sleek, Neon-Accented Design

### Vision
Transform the current soft lavender palette into a **dark-mode-forward design with neon accent pops** — think sleek streetwear app meets luxury closet organizer. Keep the inviting warmth but add energy through neon highlights, glassmorphism, and subtle motion.

### Color & Theme Changes (`src/index.css`)

**New CSS variables — dark mode as the star, with neon accents:**
- Introduce neon accent colors: `--neon-cyan: 180 100% 50%`, `--neon-pink: 330 100% 65%`, `--neon-lime: 90 100% 55%`
- Update dark mode to a richer, deeper background (near-black with blue undertone)
- Keep light mode refined but add the same neon pops as accents
- Add a subtle `--glass` variable for glassmorphism panels

**New utility classes:**
- `.neon-glow` — subtle text-shadow or box-shadow using neon cyan
- `.glass-card` — `backdrop-blur-xl bg-white/5 border-white/10` (dark) / `bg-white/60` (light)

### Header Refresh (`AppLayout.tsx`)
- Add a subtle neon underline or glow to the "Drip Slayer" logo text
- Make the `+` button use a neon gradient (cyan → pink) instead of plain primary
- Add a very subtle gradient border on the header

### Bottom Navigation (`AppLayout.tsx`)
- Active tab gets a neon cyan dot indicator below the icon (instead of just color change)
- Add a frosted glass effect to the nav bar background
- Smooth scale transition on tap

### Sidebar (`CategorySidebar.tsx`)
- Active category gets a neon left-border accent bar (2px neon cyan)
- Add item counts next to each category label
- Subtle hover glow effect

### Action Buttons (`Wardrobe.tsx`)
- **"Generate Images"** — neon lime/green gradient background
- **"Occasion"** — neon pink/magenta outline
- **"Share"** — neon cyan outline
- **"Match This Outfit"** floating bar — neon gradient button (cyan → pink), with a soft glow shadow
- Keep Transfer/Redeem/Export/Import as subtle outline buttons

### Category Pills (`Wardrobe.tsx`)
- Active pill: neon gradient background (cyan → purple) with white text
- Inactive: glass-card style with subtle border

### Item Cards (`WardrobeItemCard.tsx`)
- Add glassmorphism to the info section at the bottom
- Selection ring uses neon cyan instead of primary
- Hover: subtle neon border glow
- "new" badge gets a neon pink background with a tiny pulse animation

### Floating Selection Bar (`Wardrobe.tsx`)
- Glass effect background with neon border
- "Match This Outfit" button: neon gradient with glow shadow
- Item count badge: neon cyan pill

### Tailwind Config (`tailwind.config.ts`)
- Add neon color tokens: `neon-cyan`, `neon-pink`, `neon-lime`
- Add `glass` utility via a custom plugin or extend backgroundImage for gradients
- Add a `glow` box-shadow utility
- Add `neon-pulse` keyframe animation for badges

### Files to Change
1. **`src/index.css`** — New CSS variables for neon colors, glass utilities, glow classes
2. **`tailwind.config.ts`** — Neon color tokens, glow/glass utilities, new animations
3. **`src/components/layout/AppLayout.tsx`** — Header glow, neon `+` button, frosted bottom nav with dot indicator
4. **`src/components/layout/CategorySidebar.tsx`** — Neon active bar, hover glow
5. **`src/pages/Wardrobe.tsx`** — Colored action buttons, neon category pills, glass floating bar
6. **`src/components/wardrobe/WardrobeItemCard.tsx`** — Glass info panel, neon selection ring, glow hover
7. **`src/pages/Outfits.tsx`** — Apply same neon mood filter pills and glass card treatment

