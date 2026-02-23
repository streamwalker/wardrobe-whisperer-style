import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { DEMO_WARDROBE, type WardrobeItem } from "@/lib/wardrobe-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OutfitSuggestion {
  name: string;
  item_ids: string[];
  explanation: string;
  mood: string;
}

interface Props {
  item: WardrobeItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OutfitSuggestionDrawer({ item, open, onOpenChange }: Props) {
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState<string | null>(null);

  const fetchSuggestions = async (selectedItem: WardrobeItem) => {
    if (hasLoaded === selectedItem.id) return;
    setLoading(true);
    setOutfits([]);

    try {
      const stripped = DEMO_WARDROBE.map(({ photo, ...rest }) => rest);
      const { photo, ...selectedStripped } = selectedItem;

      const { data, error } = await supabase.functions.invoke("match-outfit", {
        body: { selectedItem: selectedStripped, wardrobeItems: stripped },
      });

      if (error) throw error;
      setOutfits(data.outfits ?? []);
      setHasLoaded(selectedItem.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to get outfit suggestions");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when drawer opens with a new item
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && item && hasLoaded !== item.id) {
      fetchSuggestions(item);
    }
  };

  const getItemById = (id: string) => DEMO_WARDROBE.find((i) => i.id === id);

  const moodEmoji: Record<string, string> = {
    casual: "☕",
    elevated: "✨",
    bold: "🔥",
    minimal: "◻️",
    sporty: "⚡",
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <Sparkles className="h-5 w-5 text-accent" />
            Outfit Ideas for {item?.name}
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Analyzing colors & styles…</p>
          </div>
        )}

        {!loading && outfits.length === 0 && hasLoaded && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No suggestions found. Try a different item!
          </p>
        )}

        <div className="space-y-5 pb-6">
          {outfits.map((outfit, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-card-foreground">
                  {outfit.name}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {moodEmoji[outfit.mood] || "👔"} {outfit.mood}
                </Badge>
              </div>

              {/* Item thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {outfit.item_ids.map((id) => {
                  const wi = getItemById(id);
                  if (!wi) return null;
                  return (
                    <div
                      key={id}
                      className="shrink-0 w-20 rounded-lg overflow-hidden border bg-secondary"
                    >
                      <div
                        className="aspect-square w-full overflow-hidden"
                        style={{ backgroundColor: wi.color_hex }}
                      >
                        {wi.photo && (
                          <img
                            src={wi.photo}
                            alt={wi.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <p className="truncate px-1.5 py-1 text-[10px] font-medium text-card-foreground">
                        {wi.name}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* AI explanation */}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {outfit.explanation}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
