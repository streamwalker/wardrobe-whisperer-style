import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Bookmark, Check, CalendarDays, CloudSun, Heart } from "lucide-react";
import { type WardrobeItem } from "@/lib/wardrobe-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OutfitSuggestion {
  name: string;
  item_ids: string[];
  explanation: string;
  mood: string;
}

const PRESET_OCCASIONS = [
  { label: "🎬 Movies", value: "Going to the movies" },
  { label: "🎳 Bowling", value: "Bowling night" },
  { label: "🍽️ Casual Dinner", value: "Casual dinner out" },
  { label: "🏖️ Beach Day", value: "Day at the beach" },
  { label: "🎉 House Party", value: "House party" },
  { label: "💼 Office", value: "Casual office day" },
  { label: "☕ Coffee Date", value: "Coffee date" },
  { label: "🏋️ Gym", value: "Gym workout" },
  { label: "🛍️ Shopping", value: "Shopping trip" },
  { label: "🎶 Concert", value: "Music concert" },
];

const WEATHER_OPTIONS = [
  { label: "☀️ Hot", value: "hot / sunny" },
  { label: "🌤️ Mild", value: "mild / comfortable" },
  { label: "🥶 Cold", value: "cold / winter" },
  { label: "🌧️ Rainy", value: "rainy / wet" },
];

const moodEmoji: Record<string, string> = {
  casual: "☕",
  elevated: "✨",
  bold: "🔥",
  minimal: "◻️",
  sporty: "⚡",
};

interface Props {
  allWardrobeItems: WardrobeItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OccasionOutfitDrawer({ allWardrobeItems, open, onOpenChange }: Props) {
  const [occasion, setOccasion] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedState, setSavedState] = useState<Map<string, "saved" | "favorited">>(new Map());
  const [savingState, setSavingState] = useState<{ idx: number; mode: "saved" | "favorited" } | null>(null);
  const { user } = useAuth();

  const activeOccasion = customOccasion.trim() || occasion;

  const handlePresetClick = (value: string) => {
    setOccasion(value);
    setCustomOccasion("");
  };

  const handleSuggest = async () => {
    if (!activeOccasion) {
      toast.error("Pick or type an occasion first");
      return;
    }
    setLoading(true);
    setOutfits([]);
    setSavedState(new Map());

    try {
      const stripped = allWardrobeItems.map(({ photo, ...rest }) => rest);
      const { data, error } = await supabase.functions.invoke("suggest-occasion-outfit", {
        body: {
          occasion: activeOccasion,
          weather: weather || undefined,
          wardrobeItems: stripped,
        },
      });
      if (error) throw error;
      setOutfits(data.outfits ?? []);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
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
        next.set(`${outfit.name}::${outfit.item_ids.join(",")}`, mode);
        return next;
      });
      toast.success(opts.favorite ? "Saved & favorited ❤️" : "Outfit saved!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save outfit");
    } finally {
      setSavingState(null);
    }
  };

  const getItemById = (id: string) => allWardrobeItems.find((i) => i.id === id);
  const outfitKey = (o: OutfitSuggestion) => `${o.name}::${o.item_ids.join(",")}`;

  const handleReset = () => {
    setOccasion("");
    setCustomOccasion("");
    setWeather("");
    setOutfits([]);
    setSavedState(new Map());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <CalendarDays className="h-5 w-5 text-accent" />
            What's the Occasion?
          </SheetTitle>
        </SheetHeader>

        {/* Occasion selection */}
        <div className="space-y-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {PRESET_OCCASIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => handlePresetClick(o.value)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  occasion === o.value && !customOccasion.trim()
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          <Input
            placeholder="Or type your own occasion…"
            value={customOccasion}
            onChange={(e) => setCustomOccasion(e.target.value)}
            className="text-sm"
          />

          {/* Weather */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <CloudSun className="h-3.5 w-3.5" />
              Weather (optional)
            </p>
            <div className="flex gap-2">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setWeather(weather === w.value ? "" : w.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    weather === w.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSuggest}
            disabled={!activeOccasion || loading}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding outfits…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Suggest Outfits
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Styling your look for "{activeOccasion}"…</p>
          </div>
        )}

        {!loading && outfits.length > 0 && (
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

            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Try Another Occasion
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
