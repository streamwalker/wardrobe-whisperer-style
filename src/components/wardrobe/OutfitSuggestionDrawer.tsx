import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Bookmark, Check, AlertTriangle, ArrowDown, ArrowRight, Wand2, Heart, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type WardrobeItem } from "@/lib/wardrobe-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import OutfitPreviewBoard, { type BoardDensity } from "./OutfitPreviewBoard";
import OutfitCompareView from "./OutfitCompareView";
import CompleteLookView from "./CompleteLookView";
import NewItemMatchCard from "./NewItemMatchCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, Rows3 } from "lucide-react";
import { useStylePreferences } from "@/hooks/useStylePreferences";
import { recordSignal, recordDismissedOutfit, snapshotFromItems } from "@/lib/style-signals";
import { rerankOutfits } from "@/lib/preference-profile";

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
  /** When set, renders a hero "spotlight" card highlighting this newly-added item's matches. */
  newlyAddedItemId?: string;
}

export default function OutfitSuggestionDrawer({ items, allWardrobeItems, open, onOpenChange, onSwapItem, headline, subheadline, prefetchedOutfits, inspirationImageUrl, newlyAddedItemId }: Props) {
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  // Map of outfitKey → which save mode was used. Absence = unsaved.
  const [savedState, setSavedState] = useState<Map<string, "saved" | "favorited">>(new Map());
  const [savingState, setSavingState] = useState<{ idx: number; mode: "saved" | "favorited" } | null>(null);
  const [incompatible, setIncompatible] = useState<IncompatibilityResult | null>(null);
  // Outfit keys dismissed during this session — hidden locally even before the
  // preference query refreshes.
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [dismissingKey, setDismissingKey] = useState<string | null>(null);
  const { profile: stylePrefs, invalidate: invalidatePrefs } = useStylePreferences();
  const [completingOutfit, setCompletingOutfit] = useState<OutfitSuggestion | null>(null);
  const [density, setDensity] = useState<BoardDensity>(() => {
    if (typeof window === "undefined") return "full";
    const stored = window.localStorage.getItem("outfit-board-density");
    return stored === "compact" ? "compact" : "full";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("outfit-board-density", density);
    }
  }, [density]);
  const { user } = useAuth();

  const isInspireMode = !!inspirationImageUrl;
  const itemsKey = isInspireMode
    ? `inspire::${inspirationImageUrl}`
    : items.map((i) => i.id).sort().join(",");

  useEffect(() => {
    if (!open) {
      setCompletingOutfit(null);
      return;
    }
    if (hasLoaded === itemsKey) return;

    // Inspire / prefetched mode: use the supplied outfits directly, no fetch.
    if (prefetchedOutfits) {
      setOutfits(prefetchedOutfits);
      setHasMore(false);
      setSavedState(new Map());
      setIncompatible(null);
      setHasLoaded(itemsKey);
      return;
    }

    if (items.length > 0) {
      setOutfits([]);
      setHasMore(true);
      setSavedState(new Map());
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

  const saveOutfit = async (
    outfit: OutfitSuggestion,
    idx: number,
    opts: { favorite: boolean } = { favorite: false },
  ) => {
    if (!user) {
      toast.error("Sign in to save outfits");
      return;
    }
    const mode: "saved" | "favorited" = opts.favorite ? "favorited" : "saved";
    setSavingState({ idx, mode });
    try {
      const { error } = await supabase.from("saved_outfits").insert({
        user_id: user.id,
        name: outfit.name,
        item_ids: outfit.item_ids,
        mood: outfit.mood,
        explanation: outfit.explanation,
        is_favorite: opts.favorite,
      });
      if (error) throw error;
      setSavedState((prev) => {
        const next = new Map(prev);
        next.set(outfitKey(outfit), mode);
        return next;
      });
      // Learning signal — fire-and-forget.
      const items = outfit.item_ids
        .map((id) => allWardrobeItems.find((i) => i.id === id))
        .filter((i): i is WardrobeItem => !!i);
      void recordSignal(
        opts.favorite ? "favorite" : "save",
        snapshotFromItems(items, outfit.mood),
        user.id,
      ).then(() => invalidatePrefs());
      toast.success(opts.favorite ? "Saved & favorited ❤️" : "Outfit saved!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save outfit");
    } finally {
      setSavingState(null);
    }
  };

  const dismissOutfit = async (outfit: OutfitSuggestion) => {
    if (!user) {
      toast.error("Sign in to personalize suggestions");
      return;
    }
    const key = outfitKey(outfit);
    setDismissingKey(key);
    try {
      const items = outfit.item_ids
        .map((id) => allWardrobeItems.find((i) => i.id === id))
        .filter((i): i is WardrobeItem => !!i);
      await Promise.all([
        recordSignal("dismiss", snapshotFromItems(items, outfit.mood), user.id),
        recordDismissedOutfit(outfit.item_ids, user.id),
      ]);
      setDismissedKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      invalidatePrefs();
      toast.success("Got it — we'll show fewer like this.");
    } finally {
      setDismissingKey(null);
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
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Sparkles className="h-5 w-5 text-accent" />
              {headline ?? drawerTitle}
            </SheetTitle>
            {!completingOutfit && !incompatible && outfits.length > 0 && (
              <ToggleGroup
                type="single"
                size="sm"
                value={density}
                onValueChange={(v) => v && setDensity(v as BoardDensity)}
                className="h-7 shrink-0"
                aria-label="Preview density"
              >
                <ToggleGroupItem value="compact" className="h-7 gap-1 px-2 text-[10px]" aria-label="Compact preview">
                  <Rows3 className="h-3 w-3" />
                  Compact
                </ToggleGroupItem>
                <ToggleGroupItem value="full" className="h-7 gap-1 px-2 text-[10px]" aria-label="Full preview">
                  <LayoutGrid className="h-3 w-3" />
                  Full
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
          {subheadline && (
            <p className="text-sm text-muted-foreground leading-relaxed">{subheadline}</p>
          )}
        </SheetHeader>

        {completingOutfit && (
          <CompleteLookView
            outfit={completingOutfit}
            existingItems={completingOutfit.item_ids
              .map((id) => allWardrobeItems.find((i) => i.id === id))
              .filter((i): i is WardrobeItem => !!i)}
            allWardrobeItems={allWardrobeItems}
            inspirationImageUrl={inspirationImageUrl}
            onBack={() => setCompletingOutfit(null)}
          />
        )}

        {!completingOutfit && loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Analyzing colors & styles…</p>
          </div>
        )}

        {/* Incompatibility alert */}
        {!completingOutfit && !loading && incompatible && (
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

        {!completingOutfit && !loading && !incompatible && outfits.length === 0 && hasLoaded && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {isInspireMode
              ? "No matches found. Try a different inspiration photo."
              : "No suggestions found. Try different items!"}
          </p>
        )}

        {!completingOutfit && !incompatible && (
          <div className="space-y-5 pb-6">
            {outfits.map((outfit, idx) => {
              const key = outfitKey(outfit);
              const savedMode = savedState.get(key);
              const isSaved = !!savedMode;
              const isFavorited = savedMode === "favorited";
              const isSavingThis = savingState?.idx === idx;
              const isSavingFavorite = isSavingThis && savingState?.mode === "favorited";
              const isSavingPlain = isSavingThis && savingState?.mode === "saved";
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
                        title="Generate complete look"
                        onClick={() => setCompletingOutfit(outfit)}
                      >
                        <Wand2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={isFavorited ? "Saved & favorited" : "Save & favorite"}
                        disabled={isSaved || isSavingThis}
                        onClick={() => saveOutfit(outfit, idx, { favorite: true })}
                      >
                        {isSavingFavorite ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              isFavorited ? "fill-primary text-primary" : "text-muted-foreground",
                            )}
                          />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={isSaved ? "Saved" : "Save"}
                        disabled={isSaved || isSavingThis}
                        onClick={() => saveOutfit(outfit, idx, { favorite: false })}
                      >
                        {isSaved && !isSavingPlain ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : isSavingPlain ? (
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
                    const newItem = newlyAddedItemId
                      ? suggestedItems.find((i) => i.id === newlyAddedItemId)
                      : undefined;
                    return (
                      <>
                        {newItem && (
                          <NewItemMatchCard
                            newItem={newItem}
                            matchingItems={suggestedItems}
                            outfitName={outfit.name}
                            aiExplanation={outfit.explanation}
                            className="mb-3"
                          />
                        )}
                      <Tabs defaultValue="board" className="w-full">
                        <TabsList className="h-8">
                          <TabsTrigger value="board" className="text-xs">Board</TabsTrigger>
                          <TabsTrigger value="compare" className="text-xs" disabled={isInspireMode}>
                            Compare
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="board" className="mt-3">
                          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
                            {isInspireMode ? (
                              <div className="flex flex-col gap-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Inspiration
                                </p>
                                <div className="rounded-2xl border border-border/40 bg-card/40 p-3 shadow-neon">
                                  <div className={`w-full overflow-hidden rounded-xl ${density === "compact" ? "h-[240px] sm:h-[280px]" : "h-[360px] sm:h-[420px]"}`}>
                                    <img
                                      src={inspirationImageUrl}
                                      alt="Inspiration"
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <OutfitPreviewBoard items={items} label="Your pick(s)" density={density} showDensityToggle={false} />
                            )}
                            <div className="flex items-center justify-center text-muted-foreground">
                              <ArrowDown className="h-5 w-5 sm:hidden" />
                              <ArrowRight className="hidden h-5 w-5 sm:block" />
                            </div>
                            <OutfitPreviewBoard
                              items={suggestedItems}
                              highlightSharedIds={sharedIds}
                              label="Suggested look"
                              density={density}
                              showDensityToggle={false}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="compare" className="mt-3">
                          <OutfitCompareView
                            seedItems={items}
                            recommendedItems={suggestedItems}
                            seedLabel="Your pick(s)"
                            recommendedLabel="Recommended outfit"
                          />
                        </TabsContent>
                      </Tabs>
                      </>
                    );
                  })()}

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {outfit.explanation}
                  </p>
                </div>
              );
            })}

            {!loading && outfits.length > 0 && isInspireMode && (
              <p className="pt-2 text-center text-xs text-muted-foreground">
                Want different ideas? Close and try another photo.
              </p>
            )}

            {!loading && outfits.length > 0 && !isInspireMode && (
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
