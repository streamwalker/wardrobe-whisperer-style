import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CATEGORIES,
  TONE_FILTERS,
  STYLE_FILTERS,
  PATTERN_OPTIONS,
  TEXTURE_OPTIONS,
  SHOE_SUBCATEGORIES,
  type WardrobeCategory,
  type WardrobeItem,
} from "@/lib/wardrobe-data";
import { toast } from "sonner";
import WardrobeItemCard from "@/components/wardrobe/WardrobeItemCard";
import DraggableItemCard from "@/components/wardrobe/DraggableItemCard";
import DroppableCategoryColumn from "@/components/wardrobe/DroppableCategoryColumn";

import OutfitSuggestionDrawer from "@/components/wardrobe/OutfitSuggestionDrawer";
import OccasionOutfitDrawer from "@/components/wardrobe/OccasionOutfitDrawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  X,
  ImagePlus,
  Loader2,
  Share2,
  Copy,
  Check,
  CalendarDays,
  ArrowRightLeft,
  Gift,
} from "lucide-react";
import TransferRedeemDialogs from "@/components/wardrobe/TransferRedeemDialogs";
import ExportImportButtons from "@/components/wardrobe/ExportImportButtons";
import { getDressShirtHint } from "@/lib/dress-shirt-hint";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useAuth } from "@/hooks/useAuth";
import { useWardrobeItems } from "@/hooks/useWardrobeItems";
import { useWardrobeFilters } from "@/hooks/useWardrobeFilters";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useWardrobeShare } from "@/hooks/useWardrobeShare";
import { useItemSelection } from "@/hooks/useItemSelection";
import { useHighlightFlash } from "@/hooks/useHighlightFlash";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function Wardrobe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Data, derived state, and concerns extracted to hooks ---
  const { items: allItems } = useWardrobeItems(user?.id);
  const filters = useWardrobeFilters();
  const imageGen = useImageGeneration(allItems);
  const share = useWardrobeShare(user?.id);
  const selection = useItemSelection();
  const highlight = useHighlightFlash();

  // --- Local UI state that remains inline ---
  const [draggingItem, setDraggingItem] = useState<WardrobeItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [occasionDrawerOpen, setOccasionDrawerOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // --- Onboarding tour ---
  const onboarding = useOnboarding({
    ready: !!user?.id,
    shouldAutoStart: !!user?.id && allItems.length === 0,
  });

  // Handle Stripe checkout success redirect (one-time on mount)
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Welcome to Pro! 🎉 Your subscription is now active.");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCategory = (searchParams.get("cat") as WardrobeCategory) || "all";
  const setActiveCategory = (cat: WardrobeCategory | "all") => {
    if (cat === "all") setSearchParams({});
    else setSearchParams({ cat });
  };

  // --- Profile for title display ---
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const wardrobeTitle = profile?.display_name
    ? `${profile.display_name}${profile.display_name.endsWith("s") ? "'" : "'s"} Wardrobe`
    : "My Wardrobe";

  const wardrobeWithPhotos = imageGen.itemsWithGenerated;

  // --- Mutation handlers that remain inline (coupled to queryClient + supabase) ---
  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("wardrobe_items").delete().eq("id", itemId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
      selection.removeById(itemId);
      toast.success("Item removed from wardrobe");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  const handleEditItem = async (
    itemId: string,
    updates: {
      name: string;
      category: string;
      subcategory?: string;
      primary_color: string;
      color_hex: string;
      style_tags: string[];
      pattern?: string;
      texture?: string;
      newPhotoFile?: File;
      newBackPhotoFile?: File;
      removeBackPhoto?: boolean;
    },
  ) => {
    const { newPhotoFile, newBackPhotoFile, removeBackPhoto, subcategory, pattern, texture, ...dbUpdates } = updates;
    let photoUrl: string | undefined;
    let photoBackUrl: string | undefined;

    if (newPhotoFile && user) {
      const ext = newPhotoFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}-edit-${itemId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("wardrobe-photos")
        .upload(filePath, newPhotoFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("wardrobe-photos").getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }

    if (newBackPhotoFile && user) {
      const ext = newBackPhotoFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}-edit-back-${itemId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("wardrobe-photos")
        .upload(filePath, newBackPhotoFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("wardrobe-photos").getPublicUrl(filePath);
      photoBackUrl = urlData.publicUrl;
    }

    const backPhotoUpdate =
      photoBackUrl !== undefined
        ? { photo_back_url: photoBackUrl }
        : removeBackPhoto
          ? { photo_back_url: null }
          : {};

    const { error } = await supabase
      .from("wardrobe_items")
      .update({
        ...dbUpdates,
        subcategory: subcategory || null,
        pattern: pattern || null,
        texture: texture || null,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
        ...backPhotoUpdate,
      } as any)
      .eq("id", itemId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
    toast.success("Item updated");

    // If category changed, navigate to the new category and pulse the moved card
    const original = allItems.find((i) => i.id === itemId);
    if (original && updates.category !== original.category) {
      setActiveCategory(updates.category as WardrobeCategory);
      highlight.flash(itemId);
    }
  };

  // --- Drag-and-drop handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as WardrobeItem | undefined;
    setDraggingItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggingItem(null);
    const { active, over } = event;
    if (!over) return;

    const item = active.data.current?.item as WardrobeItem | undefined;
    const targetCategory = over.data.current?.category as WardrobeCategory | undefined;
    if (!item || !targetCategory || item.category === targetCategory) return;

    try {
      const { error } = await supabase
        .from("wardrobe_items")
        .update({ category: targetCategory, subcategory: null })
        .eq("id", item.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
      highlight.flash(item.id);
      const catLabel = CATEGORIES.find((c) => c.value === targetCategory)?.label || targetCategory;
      toast.success(`Moved "${item.name}" to ${catLabel}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to move item");
    }
  };

  // --- Outfit matcher drawer ---
  const handleMatchThese = () => setDrawerOpen(true);
  const handleDrawerChange = (open: boolean) => setDrawerOpen(open);

  const filtered =
    activeCategory === "all"
      ? filters.applyFilters(wardrobeWithPhotos)
      : filters.applyFilters(wardrobeWithPhotos.filter((i) => i.category === activeCategory));

  return (
    <div className="space-y-3 sm:space-y-5 pb-24">
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
            {wardrobeTitle}
          </h2>
          <span className="text-xs text-muted-foreground">{wardrobeWithPhotos.length} items</span>
        </div>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {imageGen.itemsMissingPhotos.length > 0 && (
            <Button
              size="sm"
              className="gap-1 sm:gap-1.5 shrink-0 text-xs sm:text-sm neon-gradient-lime text-white border-0 shadow-neon-lime hover:opacity-90"
              onClick={imageGen.generateMissing}
              disabled={imageGen.generating}
            >
              {imageGen.generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {imageGen.genProgress.current}/{imageGen.genProgress.total}
                </>
              ) : (
                <>
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Generate</span> (
                  {imageGen.itemsMissingPhotos.length})
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1 shrink-0 text-xs sm:text-sm border-neon-pink/50 text-neon-pink hover:bg-neon-pink/10 hover:text-neon-pink"
            onClick={() => setOccasionDrawerOpen(true)}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Occasion
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 shrink-0 text-xs sm:text-sm border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 hover:text-neon-cyan"
            onClick={share.openShareDialog}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 shrink-0 text-xs sm:text-sm"
            onClick={() => setTransferDialogOpen(true)}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Transfer
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 shrink-0 text-xs sm:text-sm"
            onClick={() => setRedeemDialogOpen(true)}
          >
            <Gift className="h-3.5 w-3.5" />
            Redeem
          </Button>
          {user && <ExportImportButtons userId={user.id} allItems={wardrobeWithPhotos} />}
        </div>
      </div>

      {imageGen.generating && (
        <Progress
          value={(imageGen.genProgress.current / imageGen.genProgress.total) * 100}
          className="h-1.5"
        />
      )}

      {/* Category tabs (mobile only) */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] md:hidden">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "shrink-0 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors",
            activeCategory === "all"
              ? "neon-gradient-cyan-pink text-white shadow-neon"
              : "glass-card text-secondary-foreground hover:border-neon-cyan/30",
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "shrink-0 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors",
              activeCategory === cat.value
                ? "neon-gradient-cyan-pink text-white shadow-neon"
                : "glass-card text-secondary-foreground hover:border-neon-cyan/30",
            )}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div data-tour="filter-bar" className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none items-center">
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0">
          Tone
        </span>
        {TONE_FILTERS.map((t) => (
          <button
            key={t.value}
            onClick={() => filters.toggleTone(t.value)}
            className={cn(
              "shrink-0 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium transition-colors",
              filters.activeTones.has(t.value)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0 ml-1">
          Style
        </span>
        {STYLE_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => filters.toggleStyle(s.value)}
            className={cn(
              "shrink-0 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium transition-colors",
              filters.activeStyles.has(s.value)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0 ml-1">
          Pattern
        </span>
        {PATTERN_OPTIONS.filter((p) => wardrobeWithPhotos.some((i) => i.pattern === p)).map((p) => (
          <button
            key={p}
            onClick={() => filters.togglePattern(p)}
            className={cn(
              "shrink-0 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium capitalize transition-colors",
              filters.activePatterns.has(p)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {p}
          </button>
        ))}
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0 ml-1">
          Texture
        </span>
        {TEXTURE_OPTIONS.filter((t) => wardrobeWithPhotos.some((i) => i.texture === t)).map((t) => (
          <button
            key={t}
            onClick={() => filters.toggleTexture(t)}
            className={cn(
              "shrink-0 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium capitalize transition-colors",
              filters.activeTextures.has(t)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {t}
          </button>
        ))}
        {filters.hasFilters && (
          <button
            onClick={filters.clearFilters}
            className="shrink-0 text-[10px] sm:text-xs text-muted-foreground underline ml-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Items grid / drag-drop columns */}
      {activeCategory === "all" && !filters.hasFilters ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            {CATEGORIES.map((cat) => {
              const items = filters.applyFilters(
                wardrobeWithPhotos.filter((i) => i.category === cat.value),
              );
              if (items.length === 0) return null;
              return (
                <DroppableCategoryColumn key={cat.value} categoryValue={cat.value}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
                    {cat.value === "shoes" ? (
                      <>
                        {SHOE_SUBCATEGORIES.map((sub) => {
                          const subItems = items.filter((i) => i.subcategory === sub.value);
                          if (subItems.length === 0) return null;
                          return subItems.map((item) => (
                            <div
                              key={item.id}
                              className="shrink-0 w-28 sm:w-36 md:w-44 snap-start"
                            >
                              <DraggableItemCard
                                item={item}
                                selected={selection.selectedIds.has(item.id)}
                                highlighted={highlight.highlightId === item.id}
                                onClick={() => selection.toggle(item)}
                                onDelete={() => handleDeleteItem(item.id)}
                                onSave={(updates) => handleEditItem(item.id, updates)}
                              />
                            </div>
                          ));
                        })}
                        {(() => {
                          const uncategorized = items.filter((i) => !i.subcategory);
                          return uncategorized.map((item) => (
                            <div
                              key={item.id}
                              className="shrink-0 w-28 sm:w-36 md:w-44 snap-start"
                            >
                              <DraggableItemCard
                                item={item}
                                selected={selection.selectedIds.has(item.id)}
                                highlighted={highlight.highlightId === item.id}
                                onClick={() => selection.toggle(item)}
                                onDelete={() => handleDeleteItem(item.id)}
                                onSave={(updates) => handleEditItem(item.id, updates)}
                              />
                            </div>
                          ));
                        })()}
                      </>
                    ) : (
                      items.map((item) => (
                        <div key={item.id} className="shrink-0 w-28 sm:w-36 md:w-44 snap-start">
                          <DraggableItemCard
                            item={item}
                            selected={selection.selectedIds.has(item.id)}
                            highlighted={highlight.highlightId === item.id}
                            onClick={() => selection.toggle(item)}
                            onDelete={() => handleDeleteItem(item.id)}
                            onSave={(updates) => handleEditItem(item.id, updates)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </DroppableCategoryColumn>
              );
            })}
          </div>
          <DragOverlay>
            {draggingItem && (
              <div className="w-40 opacity-90 pointer-events-none">
                <WardrobeItemCard item={draggingItem} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <WardrobeItemCard
              key={item.id}
              item={item}
              selected={selection.selectedIds.has(item.id)}
              highlighted={highlight.highlightId === item.id}
              onClick={() => selection.toggle(item)}
              onDelete={() => handleDeleteItem(item.id)}
              onSave={(updates) => handleEditItem(item.id, updates)}
            />
          ))}
        </div>
      )}

      {/* Floating multi-select bar */}
      {selection.selectedItems.length >= 1 && !drawerOpen && (
        <div className="fixed bottom-[4.5rem] sm:bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-[calc(100vw-2rem)]">
          {(() => {
            const hint = getDressShirtHint(selection.selectedItems);
            return hint ? (
              <div className="flex items-start gap-2 rounded-xl glass-card border-neon-pink/40 px-3 py-2 shadow-neon text-[11px] sm:text-xs text-card-foreground">
                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neon-pink shrink-0 mt-0.5" />
                <span>{hint}</span>
              </div>
            ) : null;
          })()}
          <div className="flex items-center gap-2 sm:gap-3 rounded-full glass-card border-neon-cyan/30 px-3 sm:px-4 py-1.5 sm:py-2 shadow-neon">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-card-foreground whitespace-nowrap">
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neon-cyan text-[10px] sm:text-[11px] font-bold text-white px-1">
                {selection.selectedItems.length}
              </span>
              <span className="hidden xs:inline">
                {selection.selectedItems.length === 1 ? "item" : "items"}
              </span>
            </span>
            <Button
              size="sm"
              className="gap-1 sm:gap-1.5 rounded-full text-xs sm:text-sm neon-gradient-cyan-pink text-white border-0 shadow-neon hover:opacity-90"
              onClick={handleMatchThese}
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Match
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 rounded-full text-xs sm:text-sm px-2"
              onClick={selection.clear}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <OutfitSuggestionDrawer
        items={selection.selectedItems}
        allWardrobeItems={wardrobeWithPhotos}
        open={drawerOpen}
        onOpenChange={handleDrawerChange}
        onSwapItem={(oldId, newId) => {
          const newItem = allItems.find((i) => i.id === newId);
          if (newItem) selection.swap(oldId, newItem);
        }}
      />

      <OccasionOutfitDrawer
        allWardrobeItems={wardrobeWithPhotos}
        open={occasionDrawerOpen}
        onOpenChange={setOccasionDrawerOpen}
      />

      <Dialog open={share.shareDialogOpen} onOpenChange={share.setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Wardrobe</DialogTitle>
            <DialogDescription>
              Anyone with this link can view your wardrobe items.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={share.shareLink} readOnly className="text-sm" />
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0 gap-1.5"
              onClick={share.copyShareLink}
            >
              {share.linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {share.linkCopied ? "Copied" : "Copy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {user && (
        <TransferRedeemDialogs
          userId={user.id}
          transferOpen={transferDialogOpen}
          redeemOpen={redeemDialogOpen}
          onTransferChange={setTransferDialogOpen}
          onRedeemChange={setRedeemDialogOpen}
        />
      )}

    </div>
  );
}
