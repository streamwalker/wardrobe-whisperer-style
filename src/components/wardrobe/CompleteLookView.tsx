import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Bookmark, Check, Loader2, Sparkles, ImageOff, Upload, Shirt, AlertCircle, Heart } from "lucide-react";
import { type WardrobeItem, type ConceptPiece, type WardrobeCategory } from "@/lib/wardrobe-data";
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
  const [saved, setSaved] = useState<false | "saved" | "favorited">(false);
  const [savingMode, setSavingMode] = useState<null | "saved" | "favorited">(null);
  /** Picked replacements by concept index (chosen from existing wardrobe). */
  const [replacedConcepts, setReplacedConcepts] = useState<Record<number, WardrobeItem>>({});
  const [pickerForConcept, setPickerForConcept] = useState<number | null>(null);

  /** Concept indices that have NOT been replaced yet — drives the "Add missing pieces" callout. */
  const unresolvedConceptIdxs = useMemo(
    () => conceptPieces.map((_, i) => i).filter((i) => !replacedConcepts[i]),
    [conceptPieces, replacedConcepts],
  );

  /** Items eligible to replace a given concept piece: same category, not already in the look. */
  const eligibleReplacementsFor = (conceptIdx: number): WardrobeItem[] => {
    const concept = conceptPieces[conceptIdx];
    if (!concept) return [];
    const usedIds = new Set([
      ...existingItems.map((i) => i.id),
      ...Object.values(replacedConcepts).map((i) => i.id),
    ]);
    return allWardrobeItems.filter(
      (i) => i.category === concept.category && !usedIds.has(i.id),
    );
  };

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
    const replacedItems = Object.values(replacedConcepts);
    const allRealItems = [...existingItems, ...replacedItems];
    if (allRealItems.length === 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("saved_outfits").insert({
        user_id: user.id,
        name: outfit.name,
        item_ids: allRealItems.map((i) => i.id),
        mood: outfit.mood,
        explanation: rationale,
      });
      if (error) throw error;
      setSaved(true);
      const remainingConcepts = unresolvedConceptIdxs.length;
      toast.success(
        remainingConcepts > 0
          ? `Saved! ${remainingConcepts} concept piece${remainingConcepts > 1 ? "s" : ""} still missing — add them anytime.`
          : "Outfit saved with all real pieces!"
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

      {/* Add missing pieces callout */}
      {unresolvedConceptIdxs.length > 0 && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-card-foreground">Add missing pieces</p>
              <p className="text-xs text-muted-foreground">
                {unresolvedConceptIdxs.length === 1
                  ? "1 concept piece isn't in your wardrobe yet."
                  : `${unresolvedConceptIdxs.length} concept pieces aren't in your wardrobe yet.`}{" "}
                Upload it, or pick something similar you already own.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {unresolvedConceptIdxs.map((idx) => {
              const piece = conceptPieces[idx];
              const eligibleCount = eligibleReplacementsFor(idx).length;
              const hint = `${piece.primary_color} ${piece.texture || ""} ${piece.pattern || ""}`.trim();
              const addUrl = `/add?category=${encodeURIComponent(piece.category)}&name=${encodeURIComponent(piece.name)}${hint ? `&hint=${encodeURIComponent(hint)}` : ""}`;
              return (
                <div
                  key={`missing-${idx}`}
                  className="flex flex-col gap-2 rounded-lg border border-border/40 bg-card/60 p-2.5 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div
                    className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border/40"
                    style={{ backgroundColor: piece.color_hex }}
                  >
                    {piece.imageUrl && (
                      <img src={piece.imageUrl} alt={piece.name} className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">{piece.name}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">{piece.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8 gap-1 text-xs">
                      <Link to={addUrl}>
                        <Upload className="h-3.5 w-3.5" /> Upload
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 gap-1 text-xs"
                      onClick={() => setPickerForConcept(idx)}
                      disabled={eligibleCount === 0}
                      title={eligibleCount === 0 ? `No ${piece.category} in your wardrobe yet` : undefined}
                    >
                      <Shirt className="h-3.5 w-3.5" /> Pick {eligibleCount > 0 ? `(${eligibleCount})` : ""}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved replacements summary */}
      {Object.keys(replacedConcepts).length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-card-foreground mb-2 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-primary" />
            Replaced with your pieces
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(replacedConcepts).map(([idxStr, item]) => {
              const idx = Number(idxStr);
              return (
                <Badge
                  key={`replaced-${idx}`}
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={() =>
                    setReplacedConcepts((prev) => {
                      const next = { ...prev };
                      delete next[idx];
                      return next;
                    })
                  }
                  title="Click to undo"
                >
                  {item.name} ✕
                </Badge>
              );
            })}
          </div>
        </div>
      )}

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
          disabled={saving || saved || (existingItems.length + Object.keys(replacedConcepts).length) === 0}
          className="flex-1 gap-2"
          title={(existingItems.length + Object.keys(replacedConcepts).length) === 0 ? "Need at least one real wardrobe piece to save" : undefined}
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

      {/* Replacement picker dialog */}
      <Dialog open={pickerForConcept !== null} onOpenChange={(o) => !o && setPickerForConcept(null)}>
        <DialogContent className="max-w-lg border-border/40 bg-card/95">
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              Pick a replacement
              {pickerForConcept !== null && conceptPieces[pickerForConcept] && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  for "{conceptPieces[pickerForConcept].name}"
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose a piece from your wardrobe to use in this look instead of the concept piece.
            </DialogDescription>
          </DialogHeader>
          {pickerForConcept !== null && (
            <div className="max-h-[55vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {eligibleReplacementsFor(pickerForConcept).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setReplacedConcepts((prev) => ({ ...prev, [pickerForConcept!]: item }));
                      setPickerForConcept(null);
                      toast.success(`${item.name} added to the look`);
                    }}
                    className="group relative overflow-hidden rounded-lg border border-border/40 bg-secondary text-left transition-colors hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <div
                      className="aspect-square w-full"
                      style={{ backgroundColor: item.color_hex }}
                    >
                      {item.photo && (
                        <img src={item.photo} alt={item.name} className="h-full w-full object-contain p-1.5" loading="lazy" />
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="truncate text-xs font-medium text-card-foreground">{item.name}</p>
                      <p className="text-[10px] capitalize text-muted-foreground">{item.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
