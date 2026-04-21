
## Problem
The Edit Item dialog renders taller than the viewport, and the **Save Changes** button (plus lower fields) get pushed off-screen with no way to scroll. Root cause: the shared `DialogContent` in `src/components/ui/dialog.tsx` has no `max-height` or internal scrolling — it's centered with `translate(-50%, -50%)` and overflows the screen.

This affects every long dialog in the app, not just the editor.

## Fix

### 1. `src/components/ui/dialog.tsx` — make all dialogs viewport-safe
Update `DialogContent` to:
- Cap height at `max-h-[90vh]` (and `max-h-[85dvh]` on mobile for browser chrome safety)
- Make the content area scroll internally with `overflow-y-auto`
- Keep horizontal centering, add safe horizontal inset on small screens (`w-[calc(100%-2rem)]`)

This is a one-line className change and benefits every dialog (Edit, Transfer/Redeem, Outfit drawers using Dialog, etc.).

### 2. `src/components/wardrobe/EditItemDialog.tsx` — sticky save button
Restructure so the dialog body becomes a flex column:
- Header: fixed at top
- Form fields: scrollable middle section
- **Save Changes** button: sticky at the bottom inside the dialog so it's always reachable, even mid-scroll

This guarantees the primary action is always visible regardless of viewport height or zoom level.

### 3. Quick audit of other long dialogs
Verify the same pattern works for `TransferRedeemDialogs.tsx`, `OccasionOutfitDrawer.tsx`, `OutfitSuggestionDrawer.tsx`. The drawer components use `Sheet`/`Drawer` (already viewport-aware), so only Dialog-based ones need the sticky-footer treatment if their primary action sits at the bottom.

## Files touched
- `src/components/ui/dialog.tsx` — add `max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)]`
- `src/components/wardrobe/EditItemDialog.tsx` — flex layout + sticky footer for Save button
- (If needed) `src/components/wardrobe/TransferRedeemDialogs.tsx` — same sticky-footer treatment

## Verification
After changes, the Edit dialog will:
- Never exceed 90% of viewport height
- Scroll its body when content is tall
- Keep the Save button anchored at the bottom edge of the dialog
- Work at all viewport sizes (mobile, tablet, desktop, visionOS)
