import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bookmark, Check, Loader2, Sparkles, ImageOff } from "lucide-react";
import { type WardrobeItem, type ConceptPiece } from "@/lib/wardrobe-data";
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
  outfit: OutfitSuggestion;
  existingItems: WardrobeItem[];
  allWardrobeItems: WardrobeItem[];
  inspirationImageUrl?: string;
  onBack: () => void;
}

const moodEmoji: Record<string, string> = {
  casual: "☕",
  elevated: "✨",
  bold: "🔥",
  minimal: "◻️",
  sporty: "⚡",
};

export default function CompleteLookView({ outfit, existingItems, allWardrobeItems, inspirationImageUrl, onBack }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rationale, setRationale] = useState<string>(outfit.explanation);
  const [conceptPieces, setConceptPieces] = useState<ConceptPiece[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const stripped = allWardrobeItems.map(({ photo, ...rest }) => rest);
        const { data, error } = await supabase.functions.invoke("complete-look", {
          body: {
            outfit: {
              name: outfit.name,
              item_ids: outfit.item_ids,
              explanation: outfit.explanation,
              mood: outfit.mood,
            },
            wardrobeItems: stripped,
            inspirationImageUrl,
          },
        });
        if (cancelled) return;
        if (error) throw error;
        setRationale(data?.rationale || outfit.explanation);
        setConceptPieces(data?.conceptPieces || []);
      } catch (e: any) {
        if (cancelled) return;
        console.error(e);
        toast.error(e?.message || "Couldn't compose the complete look");
        onBack();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [outfit.name]);

  const handleSave = async () => {
    if (!user) {
      toast.error("Sign in to save outfits");
      return;
    }
    if (existingItems.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("saved_outfits").insert({
        user_id: user.id,
        name: outfit.name,
        item_ids: existingItems.map((i) => i.id),
        mood: outfit.mood,
        explanation: rationale,
      });
      if (error) throw error;
      setSaved(true);
      toast.success(
        conceptPieces.length > 0
          ? "Saved! Concept pieces aren't saved — explore them in Shop."
          : "Outfit saved!"
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Composing your complete look…</p>
        <p className="text-xs text-muted-foreground/70">Generating concept pieces (~10s)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Badge variant="secondary" className="text-xs">
          {moodEmoji[outfit.mood] || "👔"} {outfit.mood}
        </Badge>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-card-foreground">{outfit.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {existingItems.length} from your wardrobe
          {conceptPieces.length > 0 && ` + ${conceptPieces.length} concept piece${conceptPieces.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Composed look strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {existingItems.map((item) => (
          <div key={item.id} className="shrink-0 w-32">
            <div
              className="relative aspect-square w-full rounded-xl overflow-hidden border border-border/40"
              style={{ backgroundColor: item.color_hex }}
            >
              {item.photo && (
                <img src={item.photo} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
              )}
              <span className="absolute top-1.5 left-1.5 rounded-full bg-primary/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-foreground">
                Owned
              </span>
            </div>
            <p className="mt-1.5 truncate text-xs font-medium text-card-foreground">{item.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{item.category}</p>
          </div>
        ))}
        {conceptPieces.map((piece, idx) => (
          <div key={`concept-${idx}`} className="shrink-0 w-32">
            <div
              className="relative aspect-square w-full rounded-xl overflow-hidden border border-accent/40 shadow-neon"
              style={{ backgroundColor: piece.color_hex }}
            >
              {piece.imageUrl ? (
                <img src={piece.imageUrl} alt={piece.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted/40 p-2 text-center">
                  <ImageOff className="h-5 w-5 text-muted-foreground" />
                  <p className="text-[9px] text-muted-foreground">Image unavailable</p>
                </div>
              )}
              <span className="absolute top-1.5 left-1.5 rounded-full bg-accent/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-foreground flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> Concept
              </span>
            </div>
            <p className="mt-1.5 truncate text-xs font-medium text-card-foreground">{piece.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{piece.category}</p>
            <p className="mt-0.5 text-[9px] text-muted-foreground/80 italic">Find similar in Shop</p>
          </div>
        ))}
      </div>

      {/* Stylist rationale */}
      <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Stylist Notes</p>
        </div>
        <p className="text-sm leading-relaxed italic text-card-foreground/90">{rationale}</p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || saved || existingItems.length === 0}
          className="flex-1 gap-2"
          title={existingItems.length === 0 ? "Need at least one real wardrobe piece to save" : undefined}
        >
          {saved ? (
            <><Check className="h-4 w-4" /> Saved</>
          ) : saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            <><Bookmark className="h-4 w-4" /> Save this look</>
          )}
        </Button>
      </div>
    </div>
  );
}
