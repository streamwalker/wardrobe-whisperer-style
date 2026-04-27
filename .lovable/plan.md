## Goal
Rebuild the existing **/add** intake screen so it enforces the exact wording from your request — **Shoes / Pants / Shirts / Hoodies** — as a required item-type selector, alongside required **primary color** and at least one **style tag**. Keep all current power features (photo upload, AI auto-fill, back photo, pattern/texture, subcategories, outfit-suggestion drawer) but gate the save button behind validated intake fields with clear inline errors.

The 4-type wording is a UI label only — under the hood we still write to existing DB categories (`shoes`, `pants`, `tops`, `outerwear`) so no migration is needed and the matcher / filters / sharing all keep working.

## Type mapping (display ↔ DB)
| Intake label | DB `category` |
|---|---|
| 👟 Shoes | `shoes` |
| 👖 Pants | `pants` |
| 👕 Shirts | `tops` |
| 🧥 Hoodies | `outerwear` |

Other categories (`suits`, `accessories`, `dress-shoes`) remain editable from the wardrobe edit popover but are not offered in this intake. If the AI returns one of those, we'll fall back to the closest of the 4 (e.g. `dress-shoes` → `shoes`) and surface a small notice so you can fix it manually if needed.

## UX changes on `/add`
1. **Required Type selector (top of form, above photo)**
   - Big LCARS-style 4-pill radio rail using `LcarsPill` primitives, one per type, with emoji + label.
   - Selected pill paints in `titan-amber`; unselected use `titan-steel`.
   - Empty-state error: `"INTAKE BLOCKED · ITEM TYPE REQUIRED"` banner using `LcarsAlertBanner`.
2. **Required Primary Color**
   - Inline color name input + native color picker + hex (already present); now flagged required with red LCARS sub-label when blank on save attempt.
3. **Required Style Tags (≥1)**
   - Existing pill toggles, but now show a `"SELECT AT LEAST ONE"` micro-hint until satisfied.
4. **Save button state**
   - Disabled (grayed amber pill) until type + primary color + ≥1 style tag are set. Tooltip / sub-line explains what's missing.
   - On click with missing fields: scroll-to-first-invalid + LCARS alert chime via toast.
5. **AI auto-fill behavior**
   - Photo + AI analyze still pre-fills everything, but the user must visually confirm the type pill (we won't auto-select it as "validated"; the pill highlights in pulsing amber until tapped to confirm). This satisfies the "must set" requirement even when AI does the work.
6. **Subcategory** stays available only when type = Shoes (Hi-Tops / Boots).

## Files to edit
- **`src/pages/AddItem.tsx`** — main rebuild:
  - Replace the `<Select>` category dropdown with a 4-pill LCARS radio rail.
  - Add `validate()` helper returning `{ typeOk, colorOk, tagsOk }` and a `triedSave` flag for inline errors.
  - Map AI category → 4-type set; show notice when remapped.
  - Disable Save until valid; reorder layout so Type sits at the top of the form card.
- **`src/lib/wardrobe-data.ts`** — add an `INTAKE_TYPES` constant exporting the 4 display types with their DB category mapping (single source of truth).
- **`src/components/lcars/LcarsPrimitives.tsx`** *(only if needed)* — small `LcarsRadioRail` helper if it cleans up the JSX; otherwise compose with existing `LcarsPill`.

## Files NOT touched
- DB schema / `category` CHECK constraint — no migration needed.
- Outfit matcher, filters, sharing — they continue to see `tops`/`outerwear` as before.
- BatchAddItems — out of scope; this plan is for the single-item intake at `/add`.
- Edit popover on the wardrobe grid — keeps full 7-category list so existing items (suits, accessories, dress-shoes) remain editable.

## Validation rules (final)
- `category` must be one of the 4 intake types (after mapping).
- `primary_color` must be non-empty after `.trim()` and `color_hex` must be a valid `#RRGGBB`.
- `style_tags.length >= 1`.
- Photo remains optional (you can intake metadata-only items).

## Out of scope / open question
If you'd like the same 4-type restriction applied to **BatchAddItems** as well, say the word and I'll add it as a follow-up. Same for swapping the wardrobe filter chips to use the new "Shirts / Hoodies" wording (purely cosmetic; data stays as `tops`/`outerwear`).