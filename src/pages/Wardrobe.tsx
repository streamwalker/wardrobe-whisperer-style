import { useState } from "react";
import { DEMO_WARDROBE, CATEGORIES, type WardrobeCategory } from "@/lib/wardrobe-data";
import WardrobeItemCard from "@/components/wardrobe/WardrobeItemCard";
import { cn } from "@/lib/utils";

export default function Wardrobe() {
  const [activeCategory, setActiveCategory] = useState<WardrobeCategory | "all">("all");

  const filtered =
    activeCategory === "all"
      ? DEMO_WARDROBE
      : DEMO_WARDROBE.filter((i) => i.category === activeCategory);

  return (
    <div className="space-y-5">
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
          <WardrobeItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
