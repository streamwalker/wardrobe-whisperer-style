import { useState } from "react";
import { DEMO_WARDROBE, CATEGORIES, type WardrobeCategory, type WardrobeItem } from "@/lib/wardrobe-data";
import { toast } from "sonner";
import WardrobeItemCard from "@/components/wardrobe/WardrobeItemCard";
import OutfitSuggestionDrawer from "@/components/wardrobe/OutfitSuggestionDrawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, X, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function Wardrobe() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<WardrobeCategory | "all">("all");
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [generatedPhotos, setGeneratedPhotos] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const wardrobeTitle = profile?.display_name
    ? `${profile.display_name}${profile.display_name.endsWith('s') ? "'" : "'s"} Wardrobe`
    : "My Wardrobe";

  // Apply generated photos to wardrobe items
  const wardrobeWithPhotos = DEMO_WARDROBE.map((item) =>
    generatedPhotos[item.id] ? { ...item, photo: generatedPhotos[item.id] } : item
  );

  const itemsMissingPhotos = wardrobeWithPhotos.filter((i) => !i.photo);

  const handleGenerateImages = async () => {
    if (generating) return;
    const missing = itemsMissingPhotos;
    if (missing.length === 0) {
      toast("All items already have photos!");
      return;
    }
    setGenerating(true);
    setGenProgress({ current: 0, total: missing.length });

    for (let i = 0; i < missing.length; i++) {
      const item = missing[i];
      setGenProgress({ current: i + 1, total: missing.length });
      try {
        const { data, error } = await supabase.functions.invoke("generate-clothing-image", {
          body: { name: item.name, category: item.category, primary_color: item.primary_color },
        });
        if (error) throw error;
        if (data?.url) {
          setGeneratedPhotos((prev) => ({ ...prev, [item.id]: data.url }));
          toast.success(`Generated image for ${item.name}`);
        }
      } catch (err: any) {
        console.error(`Failed to generate image for ${item.name}:`, err);
        toast.error(`Failed: ${item.name}`);
      }
    }
    setGenerating(false);
  };

  const filtered =
    activeCategory === "all"
      ? wardrobeWithPhotos
      : wardrobeWithPhotos.filter((i) => i.category === activeCategory);
      

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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">{wardrobeTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">{wardrobeWithPhotos.length} items</p>
        </div>
        {itemsMissingPhotos.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
            onClick={handleGenerateImages}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {genProgress.current}/{genProgress.total}
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Generate Images ({itemsMissingPhotos.length})
              </>
            )}
          </Button>
        )}
      </div>
      {generating && (
        <Progress value={(genProgress.current / genProgress.total) * 100} className="h-1.5" />
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
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

      {/* Items */}
      {activeCategory === "all" ? (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-[calc(100vh-260px)]">
          {CATEGORIES.map((cat) => {
            const items = wardrobeWithPhotos.filter((i) => i.category === cat.value);
            return (
              <div key={cat.value} className="flex flex-col h-full overflow-y-auto scrollbar-none">
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1.5 px-1 flex items-center gap-1.5">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-xs font-semibold text-foreground">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  {items.map((item) => (
                    <WardrobeItemCard
                      key={item.id}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      onClick={() => handleCardClick(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
      )}

      {/* Floating multi-select bar */}
      {selectedItems.length >= 1 && !drawerOpen && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
          <span className="text-sm font-medium text-card-foreground">
            {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"} selected
          </span>
          <Button size="sm" className="gap-1.5 rounded-full" onClick={handleMatchThese}>
            <Sparkles className="h-4 w-4" />
            Match This Outfit
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 rounded-full" onClick={clearSelection}>
            <X className="h-4 w-4" />
            Clear All
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
