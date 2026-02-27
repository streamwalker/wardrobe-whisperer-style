import { useState } from "react";
import { DEMO_WARDROBE, CATEGORIES, TONE_FILTERS, STYLE_FILTERS, getColorTone, type WardrobeCategory, type WardrobeItem, type ColorTone, type StyleTag } from "@/lib/wardrobe-data";
import { toast } from "sonner";
import WardrobeItemCard from "@/components/wardrobe/WardrobeItemCard";
import EditItemDialog from "@/components/wardrobe/EditItemDialog";
import OutfitSuggestionDrawer from "@/components/wardrobe/OutfitSuggestionDrawer";
import OccasionOutfitDrawer from "@/components/wardrobe/OccasionOutfitDrawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, X, ImagePlus, Loader2, Share2, Copy, Check, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
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
import { Input } from "@/components/ui/input";

export default function Wardrobe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<WardrobeCategory | "all">("all");
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [generatedPhotos, setGeneratedPhotos] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 });
  const [activeTones, setActiveTones] = useState<Set<ColorTone>>(new Set());
  const [activeStyles, setActiveStyles] = useState<Set<StyleTag>>(new Set());
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [occasionDrawerOpen, setOccasionDrawerOpen] = useState(false);

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

  // Map DB items to WardrobeItem shape and merge with demo data
  const userItems: WardrobeItem[] = (dbItems || []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category as WardrobeCategory,
    primary_color: row.primary_color,
    color_hex: row.color_hex || '#888888',
    style_tags: (row.style_tags || []) as WardrobeItem['style_tags'],
    is_new: row.is_new ?? false,
    is_featured: row.is_featured ?? false,
    photo: row.photo_url || undefined,
  }));
  const userItemIds = new Set(userItems.map((i) => i.id));

  const allItems = [...DEMO_WARDROBE, ...userItems];

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("wardrobe_items").delete().eq("id", itemId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
      setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Item removed from wardrobe");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  const handleEditItem = async (itemId: string, updates: {
    name: string;
    category: string;
    primary_color: string;
    color_hex: string;
    style_tags: string[];
    newPhotoFile?: File;
  }) => {
    const { newPhotoFile, ...dbUpdates } = updates;
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
      .update({ ...dbUpdates, ...(photoUrl ? { photo_url: photoUrl } : {}) })
      .eq("id", itemId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
    toast.success("Item updated");
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
          toast.success(`Generated image for ${item.name}`);
        }
      } catch (err: any) {
        console.error(`Failed to generate image for ${item.name}:`, err);
        toast.error(`Failed: ${item.name}`);
      }
    }
    setGenerating(false);
  };

  const hasFilters = activeTones.size > 0 || activeStyles.size > 0;

  const applyFilters = (items: WardrobeItem[]) => {
    let result = items;
    if (activeTones.size > 0) {
      result = result.filter((i) => activeTones.has(getColorTone(i.color_hex)));
    }
    if (activeStyles.size > 0) {
      result = result.filter((i) => i.style_tags.some((t) => activeStyles.has(t)));
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
    <div className="space-y-5 pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">{wardrobeTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">{wardrobeWithPhotos.length} items</p>
        </div>
        <div className="flex gap-2 shrink-0">
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
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOccasionDrawerOpen(true)}>
            <CalendarDays className="h-4 w-4" />
            Occasion
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
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

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground mr-1">Tone</span>
        {TONE_FILTERS.map((t) => (
          <button
            key={t.value}
            onClick={() => toggleTone(t.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeTones.has(t.value)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
        <span className="text-xs font-semibold text-muted-foreground ml-2 mr-1">Style</span>
        {STYLE_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => toggleStyle(s.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeStyles.has(s.value)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-muted-foreground underline ml-1">
            Clear filters
          </button>
        )}
      </div>

      {/* Items */}
      {activeCategory === "all" && !hasFilters ? (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-[calc(100vh-310px)]">
          {CATEGORIES.map((cat) => {
            const items = applyFilters(wardrobeWithPhotos.filter((i) => i.category === cat.value));
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
                      onDelete={userItemIds.has(item.id) ? () => handleDeleteItem(item.id) : undefined}
                      onEdit={userItemIds.has(item.id) ? () => setEditingItem(item) : undefined}
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
              onDelete={userItemIds.has(item.id) ? () => handleDeleteItem(item.id) : undefined}
              onEdit={userItemIds.has(item.id) ? () => setEditingItem(item) : undefined}
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
    </div>
  );
}
