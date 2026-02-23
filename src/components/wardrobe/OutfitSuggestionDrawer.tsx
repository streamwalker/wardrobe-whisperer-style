import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Bookmark, Check } from "lucide-react";
import { DEMO_WARDROBE, type WardrobeItem } from "@/lib/wardrobe-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (open && item && hasLoaded !== item.id) {
      // Reset state for new item
      setOutfits([]);
      setHasMore(true);
      setSavedIds(new Set());
      fetchSuggestions(item, []);
    }
  }, [open, item]);

  const fetchSuggestions = async (selectedItem: WardrobeItem, excludeOutfits: string[][]) => {
    const isInitial = excludeOutfits.length === 0;
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const stripped = DEMO_WARDROBE.map(({ photo, ...rest }) => rest);
      const { photo, ...selectedStripped } = selectedItem;

      const { data, error } = await supabase.functions.invoke("match-outfit", {
        body: { selectedItem: selectedStripped, wardrobeItems: stripped, excludeOutfits },
      });

      if (error) throw error;
      const newOutfits: OutfitSuggestion[] = data.outfits ?? [];

      if (newOutfits.length < 3) {
        setHasMore(false);
      }

      setOutfits((prev) => [...prev, ...newOutfits]);
      setHasLoaded(selectedItem.id);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to get outfit suggestions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!item) return;
    const excludeOutfits = outfits.map((o) => o.item_ids);
    fetchSuggestions(item, excludeOutfits);
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const saveOutfit = async (outfit: OutfitSuggestion, idx: number) => {
    if (!user) {
      toast.error("Sign in to save outfits");
      return;
    }
    setSavingIdx(idx);
    try {
      const { error } = await supabase.from("saved_outfits").insert({
        user_id: user.id,
        name: outfit.name,
        item_ids: outfit.item_ids,
        mood: outfit.mood,
        explanation: outfit.explanation,
      });
      if (error) throw error;
      setSavedIds((prev) => new Set(prev).add(outfitKey(outfit)));
      toast.success("Outfit saved!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save outfit");
    } finally {
      setSavingIdx(null);
    }
  };

  const outfitKey = (o: OutfitSuggestion) => `${o.name}::${o.item_ids.join(",")}`;

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
          {outfits.map((outfit, idx) => {
            const isSaved = savedIds.has(outfitKey(outfit));
            return (
              <div key={idx} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-card-foreground">
                    {outfit.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {moodEmoji[outfit.mood] || "👔"} {outfit.mood}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isSaved || savingIdx === idx}
                      onClick={() => saveOutfit(outfit, idx)}
                    >
                      {isSaved ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : savingIdx === idx ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

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

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {outfit.explanation}
                </p>
              </div>
            );
          })}

          {/* Show More / No More */}
          {!loading && outfits.length > 0 && (
            <div className="flex justify-center pt-2">
              {hasMore ? (
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Show 3 More Ideas
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No more combinations available</p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
