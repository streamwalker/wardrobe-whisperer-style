import { useState, useMemo, useRef } from "react";
import { Heart, Trash2, Loader2, LogIn, FileDown, Camera, Sparkles, ImageIcon, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWardrobeItems } from "@/hooks/useWardrobeItems";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { exportOutfitsPdf } from "@/lib/export-outfits-pdf";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { OUTFITS_TOUR_STEPS } from "@/components/onboarding/outfits-tour-steps";
import { useOnboarding } from "@/hooks/useOnboarding";
import OutfitSuggestionDrawer from "@/components/wardrobe/OutfitSuggestionDrawer";

interface InspireOutfit {
  name: string;
  item_ids: string[];
  explanation: string;
  mood: string;
}

const MOOD_FILTERS = [
  { value: "all", label: "All", emoji: "🎯" },
  { value: "casual", label: "Casual", emoji: "☕" },
  { value: "elevated", label: "Elevated", emoji: "✨" },
  { value: "bold", label: "Bold", emoji: "🔥" },
  { value: "minimal", label: "Minimal", emoji: "◻️" },
  { value: "sporty", label: "Sporty", emoji: "⚡" },
];

interface SavedOutfit {
  id: string;
  name: string;
  item_ids: string[];
  mood: string | null;
  explanation: string | null;
  is_favorite: boolean | null;
  created_at: string;
}

const moodEmoji: Record<string, string> = {
  casual: "☕",
  elevated: "✨",
  bold: "🔥",
  minimal: "◻️",
  sporty: "⚡",
};

export default function Outfits() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeMood, setActiveMood] = useState("all");
  const [exporting, setExporting] = useState(false);

  // Inspire-mode state
  const [inspireSheetOpen, setInspireSheetOpen] = useState(false);
  const [inspireUploading, setInspireUploading] = useState(false);
  const [inspirePreview, setInspirePreview] = useState<string | null>(null);
  const [inspireImageUrl, setInspireImageUrl] = useState<string | null>(null);
  const [inspireOutfits, setInspireOutfits] = useState<InspireOutfit[] | null>(null);
  const [inspireDrawerOpen, setInspireDrawerOpen] = useState(false);
  const inspireCameraRef = useRef<HTMLInputElement>(null);
  const inspireGalleryRef = useRef<HTMLInputElement>(null);

  const handleExportPdf = async () => {
    if (filteredOutfits.length === 0) return;
    setExporting(true);
    try {
      const pdfOutfits = filteredOutfits.map((outfit) => ({
        name: outfit.name,
        mood: outfit.mood,
        explanation: outfit.explanation,
        items: outfit.item_ids
          .map((id) => {
            const wi = getItemById(id);
            if (!wi) return null;
            return { name: wi.name, photo: wi.photo, color_hex: wi.color_hex };
          })
          .filter(Boolean) as { name: string; photo?: string; color_hex: string }[],
      }));
      await exportOutfitsPdf(pdfOutfits);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  const { items: allItems } = useWardrobeItems(user?.id);
  const getItemById = (id: string) => allItems.find((i) => i.id === id);

  const { data: outfits = [], isLoading } = useQuery({
    queryKey: ["saved_outfits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_outfits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedOutfit[];
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase
        .from("saved_outfits")
        .update({ is_favorite: !current })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved_outfits"] }),
  });

  const deleteOutfit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_outfits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved_outfits"] });
      toast.success("Outfit removed");
    },
  });

  const handleInspireFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (allItems.length < 3) {
      toast.error("Add a few more items first to get inspired matches");
      return;
    }

    setInspirePreview(URL.createObjectURL(file));
    setInspireUploading(true);

    try {
      // Upload to wardrobe-photos bucket under inspiration prefix
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/inspiration/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("wardrobe-photos")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("wardrobe-photos").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Strip photos from wardrobe payload
      const stripped = allItems.map(({ photo, photo_back, ...rest }) => rest);

      const { data, error } = await supabase.functions.invoke("inspire-outfit", {
        body: { imageUrl: publicUrl, wardrobeItems: stripped },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const outfits: InspireOutfit[] = data?.outfits ?? [];

      setInspireImageUrl(publicUrl);
      setInspireOutfits(outfits);
      setInspireSheetOpen(false);
      setInspireDrawerOpen(true);

      if (outfits.length === 0) {
        toast("No matches found — try a different photo", { description: "Pick something with clearer outfit details." });
      }
    } catch (err: any) {
      console.error("inspire error:", err);
      toast.error(err?.message || "Failed to analyze inspiration photo");
    } finally {
      setInspireUploading(false);
    }
  };

  const closeInspireDrawer = (open: boolean) => {
    setInspireDrawerOpen(open);
    if (!open) {
      setInspirePreview(null);
      setInspireImageUrl(null);
      setInspireOutfits(null);
    }
  };

  const closeInspireSheet = (open: boolean) => {
    if (inspireUploading) return; // prevent close during upload
    setInspireSheetOpen(open);
    if (!open && !inspireDrawerOpen) {
      setInspirePreview(null);
    }
  };

  const filteredOutfits = useMemo(
    () => activeMood === "all" ? outfits : outfits.filter((o) => o.mood === activeMood),
    [outfits, activeMood]
  );


  const onboardingReady = !!user?.id && !isLoading && outfits.length > 0;
  const onboarding = useOnboarding({
    userId: user?.id,
    tourKey: "outfits",
    ready: onboardingReady,
    shouldAutoStart: onboardingReady,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="empty-state-blob">
          <div className="flex h-20 w-20 items-center justify-center rounded-full glass-card relative z-10">
            <LogIn className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Saved Outfits</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Sign in to save and view your favorite outfit combinations.
          </p>
        </div>
        <Button asChild>
          <Link to="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderInspireCta = (
    <button
      onClick={() => setInspireSheetOpen(true)}
      className="group relative w-full overflow-hidden rounded-2xl glass-card gradient-border p-4 text-left transition-all hover:shadow-neon"
      data-tour="outfits-inspire"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl neon-gradient-cyan-pink shadow-neon">
          <Camera className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-sm font-semibold text-foreground">Recreate a Look</h3>
            <Sparkles className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Snap or upload an inspiration photo — we'll match it to your wardrobe.
          </p>
        </div>
      </div>
    </button>
  );

  const inspireSheetAndDrawer = (
    <>
      <input
        ref={inspireCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInspireFile}
      />
      <input
        ref={inspireGalleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInspireFile}
      />

      <Sheet open={inspireSheetOpen} onOpenChange={closeInspireSheet}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)]"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Sparkles className="h-5 w-5 text-accent" />
              Recreate a Look
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Show us an outfit you love — we'll style it from what you already own.
            </p>
          </SheetHeader>

          {inspireUploading ? (
            <div className="flex flex-col items-center gap-3 py-10">
              {inspirePreview && (
                <img
                  src={inspirePreview}
                  alt="Inspiration preview"
                  className="h-32 w-32 rounded-xl object-cover shadow-neon"
                />
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing your inspiration…
              </div>
            </div>
          ) : (
            <div className="flex w-full gap-3 pb-4">
              <button
                onClick={() => inspireCameraRef.current?.click()}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl glass-card p-6 transition-all hover:shadow-neon"
              >
                <Camera className="h-7 w-7 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Take Photo</span>
              </button>
              <button
                onClick={() => inspireGalleryRef.current?.click()}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl glass-card p-6 transition-all hover:shadow-neon"
              >
                <ImageIcon className="h-7 w-7 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Choose Photo</span>
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {inspireImageUrl && inspireOutfits && (
        <OutfitSuggestionDrawer
          items={[]}
          allWardrobeItems={allItems}
          open={inspireDrawerOpen}
          onOpenChange={closeInspireDrawer}
          headline="Looks inspired by your photo ✨"
          subheadline="Built from your wardrobe — save the ones you love."
          prefetchedOutfits={inspireOutfits}
          inspirationImageUrl={inspireImageUrl}
        />
      )}
    </>
  );

  if (outfits.length === 0) {
    return (
      <div className="space-y-6">
        {renderInspireCta}
        <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
          <div className="empty-state-blob">
            <div className="flex h-20 w-20 items-center justify-center rounded-full glass-card relative z-10">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">No Saved Outfits</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Tap any wardrobe item to get AI outfit suggestions, or recreate a look above.
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link to="/wardrobe">Browse Wardrobe</Link>
          </Button>
        </div>
        {inspireSheetAndDrawer}
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Saved Outfits</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={exporting || filteredOutfits.length === 0}
          className="shadow-neon"
          data-tour="outfits-export"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Export PDF
        </Button>
      </div>

      {renderInspireCta}

      <div data-tour="outfits-mood-filter" className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MOOD_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveMood(f.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeMood === f.value
                ? "neon-gradient-cyan-pink text-white shadow-neon"
                : "glass-card text-secondary-foreground hover:border-neon-cyan/30"
            )}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {filteredOutfits.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No outfits match this mood filter.
        </p>
      ) : null}

      {filteredOutfits.map((outfit) => (
        <div key={outfit.id} className="rounded-xl glass-card gradient-border hover-lift p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-card-foreground">
              {outfit.name}
            </h3>
            <div className="flex items-center gap-1">
              {outfit.mood && (
                <Badge variant="secondary" className="text-xs">
                  {moodEmoji[outfit.mood] || "👔"} {outfit.mood}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  toggleFavorite.mutate({ id: outfit.id, current: !!outfit.is_favorite })
                }
              >
                <Heart
                  className={`h-4 w-4 ${outfit.is_favorite ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteOutfit.mutate(outfit.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {outfit.item_ids.length === 0 ? (
            <p className="py-2 text-xs italic text-muted-foreground">
              All items in this outfit have been removed from your wardrobe.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {outfit.item_ids.map((id) => {
                const wi = getItemById(id);
                if (!wi) return null;
                return (
                  <div
                    key={id}
                    className="shrink-0 w-20 rounded-lg overflow-hidden glass-card"
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
          )}

          {outfit.explanation && (
            <p className="text-sm leading-relaxed text-muted-foreground">{outfit.explanation}</p>
          )}
        </div>
      ))}

      <OnboardingTour
        open={onboarding.isOpen}
        onClose={onboarding.finish}
        steps={OUTFITS_TOUR_STEPS}
      />

      {inspireSheetAndDrawer}
    </div>
  );
}
