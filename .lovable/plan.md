

## Goal
Stop the Edit dialog from disappearing off-screen on long wardrobe pages. Render the edit form **anchored to the card being edited** (Popover) instead of a centered modal floating somewhere far from the user's tap.

## Approach

### 1. Replace the centered Dialog with an anchored Popover
Convert `EditItemDialog` from a `Dialog` (centered, fixed-positioned modal) to a `Popover` (anchored to the trigger). Radix's `Popover` from our existing `src/components/ui/popover.tsx` handles all the smart placement: it auto-flips above/below based on viewport space, stays within the visible area, and is anchored to the element that opened it (the card's pencil icon).

This solves the bug directly: the form opens **right next to the card the user tapped**, never below the fold.

### 2. Per-card Popover trigger
Move the popover ownership from the page level (`Wardrobe.tsx`) into `WardrobeItemCard` so the trigger and content live together. The pencil icon on each card becomes the `PopoverTrigger`, and a `PopoverContent` holding the edit form opens anchored to it.

- `Wardrobe.tsx` no longer holds `editingItem` state; instead each card manages its own open/close.
- `onEdit` prop is replaced by an `onSave` prop passed down (the existing `handleEditItem(itemId, updates)` callback), so the page still owns the mutation.
- The `DraggableItemCard` wrapper just forwards the new prop.

### 3. New component: `EditItemPopover`
Refactor `EditItemDialog.tsx` into `EditItemPopover.tsx`:
- Same form fields, same validation, same `onSave` shape (no behavior changes — just the shell).
- Wraps content in `<Popover>` / `<PopoverTrigger asChild>` / `<PopoverContent>`.
- `PopoverContent` sized `w-[22rem] max-w-[calc(100vw-1.5rem)] max-h-[80vh] overflow-y-auto` with `align="start"` and `side="bottom"` (Radix auto-flips to top when there's no room below — exactly the behavior the user wants).
- The pencil icon is the `PopoverTrigger asChild`, preserving the existing styling.
- Clicking outside or pressing Escape closes it (Radix default).
- The save button stays sticky at the bottom of the popover content.

Form contents (front/back photo grid, name, category, subcategory, color, hex, pattern, texture, style tags) remain identical — just rendered inside `PopoverContent` instead of `DialogContent`.

### 4. Cleanup in Wardrobe.tsx
- Remove `editingItem` state and the trailing `<EditItemDialog>` block.
- Remove the `EditItemDialog` import.
- Pass `onSave={(updates) => handleEditItem(item.id, updates)}` to each card.
- The lightbox dialog inside `WardrobeItemCard` stays as-is (it's a brief image viewer, fine as a centered modal).

### 5. Files touched
- **New**: `src/components/wardrobe/EditItemPopover.tsx` (refactored from EditItemDialog)
- **Delete**: `src/components/wardrobe/EditItemDialog.tsx`
- `src/components/wardrobe/WardrobeItemCard.tsx` — pencil icon becomes Popover trigger; accept `onSave` prop
- `src/components/wardrobe/DraggableItemCard.tsx` — forward `onSave` prop
- `src/pages/Wardrobe.tsx` — remove `editingItem` state + dialog mount; pass `onSave` to cards instead of `onEdit`

## Verification checklist
- Tap the pencil icon on an item near the **top** of the wardrobe → form opens below the card.
- Tap the pencil icon on an item near the **bottom** of the page → form auto-flips and opens above the card; save button remains visible.
- Tap on a card mid-list, scroll the wardrobe → popover stays anchored to the card.
- Save changes → mutation runs, popover closes, toast shows, list updates.
- Press Escape or tap outside → popover closes without saving.
- On mobile width, popover width caps at `calc(100vw - 1.5rem)` and content scrolls internally if taller than 80vh.
- Front/back photo controls, lightbox, drag-and-drop, delete, and selection all still work unchanged.

