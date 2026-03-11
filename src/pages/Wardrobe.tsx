import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { CATEGORIES, TONE_FILTERS, STYLE_FILTERS, PATTERN_OPTIONS, TEXTURE_OPTIONS, SHOE_SUBCATEGORIES, getColorTone, type WardrobeCategory, type WardrobeItem, type ColorTone, type StyleTag } from "@/lib/wardrobe-data";
import { DEFAULT_DRESS_SHIRTS } from "@/lib/default-wardrobe-items";
import { toast } from "sonner";
import WardrobeItemCard from "@/components/wardrobe/WardrobeItemCard";
import DraggableItemCard from "@/components/wardrobe/DraggableItemCard";
import DroppableCategoryColumn from "@/components/wardrobe/DroppableCategoryColumn";
import EditItemDialog from "@/components/wardrobe/EditItemDialog";
import OutfitSuggestionDrawer from "@/components/wardrobe/OutfitSuggestionDrawer";
import OccasionOutfitDrawer from "@/components/wardrobe/OccasionOutfitDrawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, X, ImagePlus, Loader2, Share2, Copy, Check, CalendarDays, ArrowRightLeft, Gift } from "lucide-react";
import TransferRedeemDialogs from "@/components/wardrobe/TransferRedeemDialogs";
import ExportImportButtons from "@/components/wardrobe/ExportImportButtons";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export default function Wardrobe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draggingItem, setDraggingItem] = useState<WardrobeItem | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeCategory = (searchParams.get("cat") as WardrobeCategory) || "all";
  const setActiveCategory = (cat: WardrobeCategory | "all") => {
    if (cat === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ cat });
    }
  };
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [generatedPhotos, setGeneratedPhotos] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 });
  const [activeTones, setActiveTones] = useState<Set<ColorTone>>(new Set());
  const [activeStyles, setActiveStyles] = useState<Set<StyleTag>>(new Set());
  const [activePatterns, setActivePatterns] = useState<Set<string>>(new Set());
  const [activeTextures, setActiveTextures] = useState<Set<string>>(new Set());
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [occasionDrawerOpen, setOccasionDrawerOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);

  const flashHighlight = (id: string) => {
    setHighlightItemId(id);
    setTimeout(() => setHighlightItemId(null), 2000);
  };

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

  // Seed default items for new users
  const seededRef = useRef(false);

  // Fetch user-added items from the database
  const { data: dbItems, isLoading: dbLoading } = useQuery({
    queryKey: ['wardrobe-items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Auto-seed default dress shirts when wardrobe is empty
  useEffect(() => {
    if (!user || dbLoading || seededRef.current) return;
    if (dbItems && dbItems.length === 0) {
      seededRef.current = true;
      const seedItems = DEFAULT_DRESS_SHIRTS.map((item) => ({
        ...item,
        user_id: user.id,
      }));
      supabase
        .from('wardrobe_items')
        .insert(seedItems)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to seed default items:', error);
          } else {
            queryClient.invalidateQueries({ queryKey: ['wardrobe-items'] });
          }
        });
    }
  }, [user, dbItems, dbLoading, queryClient]);

  // Map DB items to WardrobeItem shape and merge with demo data
  const userItems: WardrobeItem[] = (dbItems || []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category as WardrobeCategory,
    subcategory: (row as any).subcategory || undefined,
    primary_color: row.primary_color,
    color_hex: row.color_hex || '#888888',
    style_tags: (row.style_tags || []) as WardrobeItem['style_tags'],
    pattern: (row as any).pattern || undefined,
    texture: (row as any).texture || undefined,
    is_new: row.is_new ?? false,
    is_featured: row.is_featured ?? false,
    photo: row.photo_url || undefined,
  }));
  const allItems = userItems;

  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const confirmDeleteItem = async () => {
    if (!deleteItemId) return;
    try {
      const { error } = await supabase.from("wardrobe_items").delete().eq("id", deleteItemId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
      setSelectedItems((prev) => prev.filter((i) => i.id !== deleteItemId));
      toast.success("Item removed from wardrobe");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    } finally {
      setDeleteItemId(null);
    }
  };

  const handleEditItem = async (itemId: string, updates: {
    name: string;
    category: string;
    subcategory?: string;
    primary_color: string;
    color_hex: string;
    style_tags: string[];
    pattern?: string;
    texture?: string;
    newPhotoFile?: File;
  }) => {
    const { newPhotoFile, subcategory, pattern, texture, ...dbUpdates } = updates;
    let photoUrl: string | undefined;

    // Upload new photo if provided
    if (newPhotoFile && user) {
      const ext = newPhotoFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}-edit-${itemId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("wardrobe-photos")
        .upload(filePath, newPhotoFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("wardrobe-photos")
        .getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("wardrobe_items")
      .update({ ...dbUpdates, subcategory: subcategory || null, pattern: pattern || null, texture: texture || null, ...(photoUrl ? { photo_url: photoUrl } : {}) } as any)
      .eq("id", itemId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
    toast.success("Item updated");
    // If category changed, switch tab to the new category
    if (editingItem && updates.category !== editingItem.category) {
      setActiveCategory(updates.category as WardrobeCategory);
      flashHighlight(itemId);
    }
  };

  const wardrobeTitle = profile?.display_name
    ? `${profile.display_name}${profile.display_name.endsWith('s') ? "'" : "'s"} Wardrobe`
    : "My Wardrobe";

  // Apply generated photos to wardrobe items
  const wardrobeWithPhotos = allItems.map((item) =>
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
          // Persist to database
          await supabase
            .from("wardrobe_items")
            .update({ photo_url: data.url })
            .eq("id", item.id);
          toast.success(`Generated image for ${item.name}`);
        }
      } catch (err: any) {
        console.error(`Failed to generate image for ${item.name}:`, err);
        toast.error(`Failed: ${item.name}`);
      }
    }
    // Refresh wardrobe data so persisted photos show from DB
    queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
    setGenerating(false);
  };

  const hasFilters = activeTones.size > 0 || activeStyles.size > 0 || activePatterns.size > 0 || activeTextures.size > 0;

  const applyFilters = (items: WardrobeItem[]) => {
    let result = items;
    if (activeTones.size > 0) {
      result = result.filter((i) => activeTones.has(getColorTone(i.color_hex)));
    }
    if (activeStyles.size > 0) {
      result = result.filter((i) => i.style_tags.some((t) => activeStyles.has(t)));
    }
    if (activePatterns.size > 0) {
      result = result.filter((i) => i.pattern && activePatterns.has(i.pattern));
    }
    if (activeTextures.size > 0) {
      result = result.filter((i) => i.texture && activeTextures.has(i.texture));
    }
    return result;
  };

  const toggleTone = (tone: ColorTone) => {
    setActiveTones((prev) => {
      const next = new Set(prev);
      next.has(tone) ? next.delete(tone) : next.add(tone);
      return next;
    });
  };

  const toggleStyle = (style: StyleTag) => {
    setActiveStyles((prev) => {
      const next = new Set(prev);
      next.has(style) ? next.delete(style) : next.add(style);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveTones(new Set());
    setActiveStyles(new Set());
    setActivePatterns(new Set());
    setActiveTextures(new Set());
  };

  const togglePattern = (p: string) => {
    setActivePatterns((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  const toggleTexture = (t: string) => {
    setActiveTextures((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const filtered =
    activeCategory === "all"
      ? applyFilters(wardrobeWithPhotos)
      : applyFilters(wardrobeWithPhotos.filter((i) => i.category === activeCategory));

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
      flashHighlight(item.id);
      const catLabel = CATEGORIES.find(c => c.value === targetCategory)?.label || targetCategory;
      toast.success(`Moved "${item.name}" to ${catLabel}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to move item");
    }
  };

  const handleDrawerChange = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      // Keep selection visible so user can adjust and re-match
    }
  };

  const handleSwapItem = (oldItemId: string, newItemId: string) => {
    const newItem = allItems.find((i) => i.id === newItemId);
    if (!newItem) return;
    setSelectedItems((prev) => prev.map((i) => (i.id === oldItemId ? newItem : i)));
  };

  const handleShare = async () => {
    if (!user) return;
    try {
      // Check for existing active share
      const { data: existing } = await supabase
        .from("wardrobe_shares")
        .select("share_token")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      let token = existing?.share_token;
      if (!token) {
        const { data: newShare, error } = await supabase
          .from("wardrobe_shares")
          .insert({ user_id: user.id })
          .select("share_token")
          .single();
        if (error) throw error;
        token = newShare.share_token;
      }

      const url = `${window.location.origin}/shared/${token}`;
      setShareLink(url);
      setLinkCopied(false);
      setShareDialogOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to create share link");
    }
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-5 pb-24">
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">{wardrobeTitle}</h2>
          <span className="text-xs text-muted-foreground">{wardrobeWithPhotos.length} items</span>
        </div>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
        {itemsMissingPhotos.length > 0 && (
          <Button
            size="sm"
            className="gap-1 sm:gap-1.5 shrink-0 text-xs sm:text-sm neon-gradient-lime text-white border-0 shadow-neon-lime hover:opacity-90"
            onClick={handleGenerateImages}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {genProgress.current}/{genProgress.total}
              </>
            ) : (
              <>
                <ImagePlus className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Generate</span> ({itemsMissingPhotos.length})
              </>
            )}
          </Button>
        )}
          <Button size="sm" variant="outline" className="gap-1 shrink-0 text-xs sm:text-sm border-neon-pink/50 text-neon-pink hover:bg-neon-pink/10 hover:text-neon-pink" onClick={() => setOccasionDrawerOpen(true)}>
            <CalendarDays className="h-3.5 w-3.5" />
            Occasion
          </Button>
          <Button size="sm" variant="outline" className="gap-1 shrink-0 text-xs sm:text-sm border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 hover:text-neon-cyan" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button size="sm" variant="outline" className="gap-1 shrink-0 text-xs sm:text-sm" onClick={() => setTransferDialogOpen(true)}>
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Transfer
          </Button>
          <Button size="sm" variant="outline" className="gap-1 shrink-0 text-xs sm:text-sm" onClick={() => setRedeemDialogOpen(true)}>
            <Gift className="h-3.5 w-3.5" />
            Redeem
          </Button>
          {user && <ExportImportButtons userId={user.id} allItems={wardrobeWithPhotos} />}
        </div>
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
              ? "neon-gradient-cyan-pink text-white shadow-neon"
              : "glass-card text-secondary-foreground hover:border-neon-cyan/30"
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
                ? "neon-gradient-cyan-pink text-white shadow-neon"
                : "glass-card text-secondary-foreground hover:border-neon-cyan/30"
            )}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Filter bar — horizontally scrollable on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none items-center">
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0">Tone</span>
        {TONE_FILTERS.map((t) => (
          <button
            key={t.value}
            onClick={() => toggleTone(t.value)}
            className={cn(
              "shrink-0 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium transition-colors",
              activeTones.has(t.value)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0 ml-1">Style</span>
        {STYLE_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => toggleStyle(s.value)}
            className={cn(
              "shrink-0 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium transition-colors",
              activeStyles.has(s.value)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0 ml-1">Pattern</span>
        {PATTERN_OPTIONS.filter(p => wardrobeWithPhotos.some(i => i.pattern === p)).map((p) => (
          <button
            key={p}
            onClick={() => togglePattern(p)}
            className={cn(
              "shrink-0 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium capitalize transition-colors",
              activePatterns.has(p)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {p}
          </button>
        ))}
        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0 ml-1">Texture</span>
        {TEXTURE_OPTIONS.filter(t => wardrobeWithPhotos.some(i => i.texture === t)).map((t) => (
          <button
            key={t}
            onClick={() => toggleTexture(t)}
            className={cn(
              "shrink-0 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium capitalize transition-colors",
              activeTextures.has(t)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {t}
          </button>
        ))}
        {hasFilters && (
          <button onClick={clearFilters} className="shrink-0 text-[10px] sm:text-xs text-muted-foreground underline ml-1">
            Clear
          </button>
        )}
      </div>

      {/* Items */}
      {activeCategory === "all" && !hasFilters ? (
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const items = applyFilters(wardrobeWithPhotos.filter((i) => i.category === cat.value));
            if (items.length === 0) return null;
            return (
              <DroppableCategoryColumn key={cat.value} categoryValue={cat.value}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                <div className="flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
                  {cat.value === 'shoes' ? (
                    <>
                      {SHOE_SUBCATEGORIES.map((sub) => {
                        const subItems = items.filter((i) => i.subcategory === sub.value);
                        if (subItems.length === 0) return null;
                        return subItems.map((item) => (
                          <div key={item.id} className="shrink-0 w-36 sm:w-44 snap-start">
                            <DraggableItemCard
                              item={item}
                              selected={selectedIds.has(item.id)}
                              highlighted={highlightItemId === item.id}
                              onClick={() => handleCardClick(item)}
                              onDelete={() => setDeleteItemId(item.id)}
                              onEdit={() => setEditingItem(item)}
                            />
                          </div>
                        ));
                      })}
                      {(() => {
                        const uncategorized = items.filter((i) => !i.subcategory);
                        return uncategorized.map((item) => (
                          <div key={item.id} className="shrink-0 w-36 sm:w-44 snap-start">
                            <DraggableItemCard
                              item={item}
                              selected={selectedIds.has(item.id)}
                              highlighted={highlightItemId === item.id}
                              onClick={() => handleCardClick(item)}
                              onDelete={() => setDeleteItemId(item.id)}
                              onEdit={() => setEditingItem(item)}
                            />
                          </div>
                        ));
                      })()}
                    </>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="shrink-0 w-36 sm:w-44 snap-start">
                        <DraggableItemCard
                          item={item}
                          selected={selectedIds.has(item.id)}
                          highlighted={highlightItemId === item.id}
                          onClick={() => handleCardClick(item)}
                          onDelete={() => setDeleteItemId(item.id)}
                          onEdit={() => setEditingItem(item)}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <WardrobeItemCard
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              highlighted={highlightItemId === item.id}
              onClick={() => handleCardClick(item)}
              onDelete={() => setDeleteItemId(item.id)}
              onEdit={() => setEditingItem(item)}
            />
          ))}
        </div>
      )}

      {/* Floating multi-select bar */}
      {selectedItems.length >= 1 && !drawerOpen && (
        <div className="fixed bottom-[4.5rem] sm:bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 rounded-full glass-card border-neon-cyan/30 px-3 sm:px-4 py-1.5 sm:py-2 shadow-neon max-w-[calc(100vw-2rem)]">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-card-foreground whitespace-nowrap">
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neon-cyan text-[10px] sm:text-[11px] font-bold text-white px-1">
              {selectedItems.length}
            </span>
            <span className="hidden xs:inline">{selectedItems.length === 1 ? "item" : "items"}</span>
          </span>
          <Button size="sm" className="gap-1 sm:gap-1.5 rounded-full text-xs sm:text-sm neon-gradient-cyan-pink text-white border-0 shadow-neon hover:opacity-90" onClick={handleMatchThese}>
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Match
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 rounded-full text-xs sm:text-sm px-2" onClick={clearSelection}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <OutfitSuggestionDrawer
        items={selectedItems}
        allWardrobeItems={wardrobeWithPhotos}
        open={drawerOpen}
        onOpenChange={handleDrawerChange}
        onSwapItem={handleSwapItem}
      />

      <OccasionOutfitDrawer
        allWardrobeItems={wardrobeWithPhotos}
        open={occasionDrawerOpen}
        onOpenChange={setOccasionDrawerOpen}
      />


      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Wardrobe</DialogTitle>
            <DialogDescription>
              Anyone with this link can view your wardrobe items.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={shareLink} readOnly className="text-sm" />
            <Button size="sm" variant="secondary" className="shrink-0 gap-1.5" onClick={copyShareLink}>
              {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {linkCopied ? "Copied" : "Copy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit item dialog */}
      {editingItem && (
        <EditItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => { if (!open) setEditingItem(null); }}
          onSave={(updates) => handleEditItem(editingItem.id, updates)}
        />
      )}
      {user && (
        <TransferRedeemDialogs
          userId={user.id}
          transferOpen={transferDialogOpen}
          redeemOpen={redeemDialogOpen}
          onTransferChange={setTransferDialogOpen}
          onRedeemChange={setRedeemDialogOpen}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => { if (!open) setDeleteItemId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The item will be permanently removed from your wardrobe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
