import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Bookmark, Check, AlertTriangle, ArrowDown, ArrowRight } from "lucide-react";
import { type WardrobeItem } from "@/lib/wardrobe-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import OutfitPreviewBoard from "./OutfitPreviewBoard";

interface OutfitSuggestion {
  name: string;
  item_ids: string[];
  explanation: string;
  mood: string;
}

interface SuggestedReplacement {
  id: string;
  reason: string;
}

interface IncompatibilityResult {
  compatible: false;
  reason: string;
  problem_item_id: string;
  suggested_replacements: SuggestedReplacement[];
}

interface Props {
  items: WardrobeItem[];
  allWardrobeItems: WardrobeItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwapItem?: (oldItemId: string, newItemId: string) => void;
  headline?: string;
  subheadline?: string;
  /** When provided, drawer skips its internal match-outfit call and renders these instead. */
  prefetchedOutfits?: OutfitSuggestion[];
  /** When set, replaces the empty "your pick(s)" board with the inspiration thumbnail. */
  inspirationImageUrl?: string;
}

export default function OutfitSuggestionDrawer({ items, allWardrobeItems, open, onOpenChange, onSwapItem, headline, subheadline, prefetchedOutfits, inspirationImageUrl }: Props) {
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [incompatible, setIncompatible] = useState<IncompatibilityResult | null>(null);
  const { user } = useAuth();

  const isInspireMode = !!inspirationImageUrl;
  const itemsKey = isInspireMode
    ? `inspire::${inspirationImageUrl}`
    : items.map((i) => i.id).sort().join(",");

  useEffect(() => {
    if (!open) return;
    if (hasLoaded === itemsKey) return;

    // Inspire / prefetched mode: use the supplied outfits directly, no fetch.
    if (prefetchedOutfits) {
      setOutfits(prefetchedOutfits);
      setHasMore(false);
      setSavedIds(new Set());
      setIncompatible(null);
      setHasLoaded(itemsKey);
      return;
    }

    if (items.length > 0) {
      setOutfits([]);
      setHasMore(true);
      setSavedIds(new Set());
      setIncompatible(null);
      fetchSuggestions(items, []);
    }
  }, [open, itemsKey, prefetchedOutfits]);

  const fetchSuggestions = async (selectedItems: WardrobeItem[], excludeOutfits: string[][]) => {
    const isInitial = excludeOutfits.length === 0;
    if (isInitial) {
      setLoading(true);
      setIncompatible(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const stripped = allWardrobeItems.map(({ photo, ...rest }) => rest);
      const strippedSelected = items.map(({ photo, ...rest }) => rest);

      const body: any = {
        wardrobeItems: stripped,
        excludeOutfits,
      };

      if (strippedSelected.length === 1) {
        body.selectedItem = strippedSelected[0];
      } else {
        body.selectedItems = strippedSelected;
      }

      const { data, error } = await supabase.functions.invoke("match-outfit", { body });

      if (error) throw error;

      // Handle incompatibility response
      if (data.compatible === false) {
        setIncompatible(data as IncompatibilityResult);
        setHasLoaded(itemsKey);
        return;
      }

      const newOutfits: OutfitSuggestion[] = data.outfits ?? [];

      if (newOutfits.length < 3) {
        setHasMore(false);
      }

      setOutfits((prev) => [...prev, ...newOutfits]);
      setHasLoaded(itemsKey);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to get outfit suggestions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (items.length === 0) return;
    const excludeOutfits = outfits.map((o) => o.item_ids);
    fetchSuggestions(items, excludeOutfits);
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

  const handleSwap = (replacementId: string) => {
    if (!incompatible || !onSwapItem) return;
    onSwapItem(incompatible.problem_item_id, replacementId);
  };

  const outfitKey = (o: OutfitSuggestion) => `${o.name}::${o.item_ids.join(",")}`;
  const getItemById = (id: string) => allWardrobeItems.find((i) => i.id === id);

  const moodEmoji: Record<string, string> = {
    casual: "☕",
    elevated: "✨",
    bold: "🔥",
    minimal: "◻️",
    sporty: "⚡",
  };

  const drawerTitle = items.length === 1
    ? `Outfit Ideas for ${items[0]?.name}`
    : `Outfit Ideas for ${items.length} Items`;

  const problemItem = incompatible ? getItemById(incompatible.problem_item_id) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <Sparkles className="h-5 w-5 text-accent" />
            {headline ?? drawerTitle}
          </SheetTitle>
          {subheadline && (
            <p className="text-sm text-muted-foreground leading-relaxed">{subheadline}</p>
          )}
        </SheetHeader>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Analyzing colors & styles…</p>
          </div>
        )}

        {/* Incompatibility alert */}
        {!loading && incompatible && (
          <div className="space-y-4 pb-6">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-display text-base font-semibold text-card-foreground">
                    These items don't pair well
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {incompatible.reason}
                  </p>
                </div>
              </div>

              {problemItem && incompatible.suggested_replacements.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Try swapping {problemItem.name} for:
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                    {incompatible.suggested_replacements.map((rep) => {
                      const repItem = getItemById(rep.id);
                      if (!repItem) return null;
                      return (
                        <button
                          key={rep.id}
                          onClick={() => handleSwap(rep.id)}
                          className="shrink-0 w-24 rounded-xl border bg-card p-2 text-left transition-colors hover:border-primary hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <div
                            className="aspect-square w-full rounded-lg overflow-hidden mb-1.5"
                            style={{ backgroundColor: repItem.color_hex }}
                          >
                            {repItem.photo && (
                              <img
                                src={repItem.photo}
                                alt={repItem.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <p className="truncate text-xs font-medium text-card-foreground">
                            {repItem.name}
                          </p>
                          <p className="text-[10px] leading-tight text-muted-foreground mt-0.5 line-clamp-2">
                            {rep.reason}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !incompatible && outfits.length === 0 && hasLoaded && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No suggestions found. Try different items!
          </p>
        )}

        {!incompatible && (
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

                  {(() => {
                    const suggestedItems = outfit.item_ids
                      .map(getItemById)
                      .filter((i): i is WardrobeItem => !!i);
                    const sharedIds = items
                      .map((i) => i.id)
                      .filter((id) => outfit.item_ids.includes(id));
                    return (
                      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
                        <OutfitPreviewBoard items={items} label="Your pick(s)" />
                        <div className="flex items-center justify-center text-muted-foreground">
                          <ArrowDown className="h-5 w-5 sm:hidden" />
                          <ArrowRight className="hidden h-5 w-5 sm:block" />
                        </div>
                        <OutfitPreviewBoard
                          items={suggestedItems}
                          highlightSharedIds={sharedIds}
                          label="Suggested look"
                        />
                      </div>
                    );
                  })()}

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {outfit.explanation}
                  </p>
                </div>
              );
            })}

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
        )}
      </SheetContent>
    </Sheet>
  );
}
