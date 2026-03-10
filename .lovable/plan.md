

# Glassmorphism & Gradient Upgrade for Drip Slayer

Inspired by the reference image, we'll enhance the app with layered glassmorphism, animated gradient blobs, and richer visual depth — all while keeping the existing neon brand identity (cyan, pink, lime).

## Changes

### 1. Global Styles (`src/index.css`)
- Add animated gradient blob keyframes and utility classes
- Enhance `.glass-card` with stronger blur, subtle gradient borders, and inner glow
- Add new utilities: `.glass-panel` (lighter glass for sections), `.gradient-border` (animated border shimmer), `.bg-mesh` (mesh gradient background)

### 2. Auth Page (`src/pages/Auth.tsx`)
- Add floating gradient blobs (cyan/pink/purple) behind the form — similar to the reference image's organic shapes
- Wrap the form in a glassmorphism card with gradient border glow
- Add subtle radial gradient overlay on the background

### 3. App Layout (`src/components/layout/AppLayout.tsx`)
- Upgrade header with gradient glass effect and animated border shimmer
- Bottom nav: stronger glassmorphism with gradient accent line on top
- Add a subtle fixed background mesh gradient behind the whole app

### 4. Category Sidebar (`src/components/layout/CategorySidebar.tsx`)
- Glass background with subtle gradient overlay
- Active item gets a soft neon glow pill background instead of just text color change

### 5. Wardrobe Item Cards (`src/components/wardrobe/WardrobeItemCard.tsx`)
- Glass panel info section with gradient border on hover
- Subtle inner glow on hover state

### 6. Tailwind Config (`tailwind.config.ts`)
- Add `blob-float` and `gradient-shift` keyframe animations
- Add gradient background utilities

### Files to Edit
| File | Change |
|------|--------|
| `src/index.css` | New glass/gradient utilities, blob animations |
| `tailwind.config.ts` | New keyframes and animation definitions |
| `src/pages/Auth.tsx` | Glassmorphism card + floating gradient blobs |
| `src/components/layout/AppLayout.tsx` | Enhanced header/nav glass + background mesh |
| `src/components/layout/CategorySidebar.tsx` | Glass sidebar with glow active states |
| `src/components/wardrobe/WardrobeItemCard.tsx` | Glass hover effects, gradient border |

