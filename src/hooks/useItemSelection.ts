import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { WardrobeItem } from "@/lib/wardrobe-data";

/**
 * Multi-select state with per-category uniqueness: selecting a second item
 * from the same category swaps out the first rather than adding it. This
 * mirrors the UX intent — a single outfit has one of each category.
 *
 * - `toggle(item)`: select if not selected, deselect if selected, swap if
 *   the category already has a different selected item.
 * - `swap(oldId, newItem)`: replace one selected item with another (used
 *   when the outfit suggestion drawer recommends a replacement).
 * - `clear()`: empty the selection.
 */
export function useItemSelection() {
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);

  const selectedIds = useMemo(() => new Set(selectedItems.map((i) => i.id)), [selectedItems]);

  const toggle = useCallback((item: WardrobeItem) => {
    setSelectedItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev.filter((i) => i.id !== item.id);
      }
      const existing = prev.find((i) => i.category === item.category);
      const withoutSameCategory = prev.filter((i) => i.category !== item.category);
      if (existing) {
        toast(`Swapped ${item.category}`);
      }
      return [...withoutSameCategory, item];
    });
  }, []);

  const swap = useCallback((oldItemId: string, newItem: WardrobeItem) => {
    setSelectedItems((prev) => prev.map((i) => (i.id === oldItemId ? newItem : i)));
  }, []);

  const clear = useCallback(() => setSelectedItems([]), []);

  const removeById = useCallback((id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { selectedItems, selectedIds, toggle, swap, clear, removeById };
}
