import { useState, useMemo } from "react";
import { Heart, Trash2, Loader2, LogIn, FileDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWardrobeItems } from "@/hooks/useWardrobeItems";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { exportOutfitsPdf } from "@/lib/export-outfits-pdf";

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

  const filteredOutfits = useMemo(
    () => activeMood === "all" ? outfits : outfits.filter((o) => o.mood === activeMood),
    [outfits, activeMood]
  );

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

  if (outfits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="empty-state-blob">
          <div className="flex h-20 w-20 items-center justify-center rounded-full glass-card relative z-10">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">No Saved Outfits</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Tap any wardrobe item to get AI outfit suggestions, then save your favorites here.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/wardrobe">Browse Wardrobe</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Saved Outfits</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={exporting || filteredOutfits.length === 0}
          className="shadow-neon"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Export PDF
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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

          {outfit.explanation && (
            <p className="text-sm leading-relaxed text-muted-foreground">{outfit.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}
