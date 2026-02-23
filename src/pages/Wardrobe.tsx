import { useState } from "react";
import { DEMO_WARDROBE, CATEGORIES, type WardrobeCategory, type WardrobeItem } from "@/lib/wardrobe-data";
import { toast } from "sonner";
import WardrobeItemCard from "@/components/wardrobe/WardrobeItemCard";
import OutfitSuggestionDrawer from "@/components/wardrobe/OutfitSuggestionDrawer";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Wardrobe() {
  const [activeCategory, setActiveCategory] = useState<WardrobeCategory | "all">("all");
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered =
    activeCategory === "all"
      ? DEMO_WARDROBE
      : DEMO_WARDROBE.filter((i) => i.category === activeCategory);

  const selectedIds = new Set(selectedItems.map((i) => i.id));

  const handleCardClick = (item: WardrobeItem) => {
    if (selectedIds.has(item.id)) {
      // Deselect
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems((prev) => {
        const existing = prev.find((i) => i.category === item.category);
        const withoutSameCategory = prev.filter((i) => i.category !== item.category);
        if (existing) {
          toast(`Swapped ${item.category}`);
        }
        const updated = [...withoutSameCategory, item];
        if (prev.length === 0) {
          setDrawerOpen(true);
        }
        return updated;
      });
    }
  };

  const handleMatchThese = () => {
    setDrawerOpen(true);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const handleDrawerChange = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      // Keep selection visible so user can adjust and re-match
    }
  };

  const handleSwapItem = (oldItemId: string, newItemId: string) => {
    const newItem = DEMO_WARDROBE.find((i) => i.id === newItemId);
    if (!newItem) return;
    setSelectedItems((prev) => prev.map((i) => (i.id === oldItemId ? newItem : i)));
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">My Wardrobe</h2>
        <p className="text-sm text-muted-foreground mt-1">{DEMO_WARDROBE.length} items</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            activeCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => (
          <WardrobeItemCard
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onClick={() => handleCardClick(item)}
          />
        ))}
      </div>

      {/* Floating multi-select bar */}
      {selectedItems.length >= 2 && !drawerOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
          <span className="text-sm font-medium text-card-foreground">
            {selectedItems.length} items selected
          </span>
          <Button size="sm" className="gap-1.5 rounded-full" onClick={handleMatchThese}>
            <Sparkles className="h-4 w-4" />
            Match These
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <OutfitSuggestionDrawer
        items={selectedItems}
        open={drawerOpen}
        onOpenChange={handleDrawerChange}
        onSwapItem={handleSwapItem}
      />
    </div>
  );
}
