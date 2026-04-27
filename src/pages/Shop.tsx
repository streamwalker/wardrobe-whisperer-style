import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Sparkles, X, ImageIcon, Plus, Check, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useWardrobeItems } from "@/hooks/useWardrobeItems";
import { useQueryClient } from "@tanstack/react-query";
import { type WardrobeItem } from "@/lib/wardrobe-data";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LcarsSection } from "@/components/lcars/LcarsSection";

interface AnalyzedItem {
  name: string;
  category: string;
  primary_color: string;
  color_hex: string;
  style_tags: string[];
}

interface OutfitSuggestion {
  name: string;
  item_ids: string[];
  explanation: string;
  mood: string;
}

const moodEmoji: Record<string, string> = {
  casual: "☕",
  elevated: "✨",
  bold: "🔥",
  minimal: "◻️",
  sporty: "⚡",
};

export default function Shop() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch user's wardrobe items (shared hook handles DB->client mapping + default seeding)
  const { items: wardrobeItems } = useWardrobeItems(user?.id);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [analyzedItem, setAnalyzedItem] = useState<AnalyzedItem | null>(null);
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setAnalyzedItem(null);
    setOutfits([]);
  };

  const reset = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setAnalyzedItem(null);
    setOutfits([]);
    setUploadedPhotoUrl(null);
    setSaved(false);
  };

  const handleAnalyzeAndMatch = async () => {
    if (!photoFile || !user) {
      if (!user) toast.error("Sign in to use Shopping Mode");
      return;
    }

    setAnalyzing(true);
    let item: AnalyzedItem | null = null;
    try {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/shop-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("wardrobe-photos")
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("wardrobe-photos")
        .getPublicUrl(filePath);

      setUploadedPhotoUrl(urlData.publicUrl);

      const { data, error } = await supabase.functions.invoke("analyze-clothing", {
        body: { imageUrl: urlData.publicUrl },
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      item = {
        name: data.name || "Unknown Item",
        category: data.category || "tops",
        primary_color: data.primary_color || "Unknown",
        color_hex: data.color_hex || "#888888",
        style_tags: data.style_tags || [],
      };
      setAnalyzedItem(item);
    } catch (err: any) {
      console.error("Analyze error:", err);
      toast.error(err.message || "Failed to analyze photo");
      return;
    } finally {
      setAnalyzing(false);
    }

    if (!item) return;
    setMatching(true);
    try {
      const fakeWardrobeItem: WardrobeItem = {
        id: "shop-item",
        name: item.name,
        category: item.category as any,
        primary_color: item.primary_color,
        color_hex: item.color_hex,
        style_tags: item.style_tags as any[],
        is_new: false,
        is_featured: false,
      };

      const stripped = wardrobeItems.map(({ photo, ...rest }) => rest);
      const { data, error } = await supabase.functions.invoke("match-outfit", {
        body: {
          selectedItem: fakeWardrobeItem,
          wardrobeItems: [...stripped, fakeWardrobeItem],
          excludeOutfits: [],
        },
      });

      if (error) throw error;
      setOutfits(data.outfits ?? []);
    } catch (err: any) {
      console.error("Match error:", err);
      toast.error(err.message || "Failed to find outfit matches");
    } finally {
      setMatching(false);
    }
  };

  const handleSaveToWardrobe = async () => {
    if (!analyzedItem || !user || !uploadedPhotoUrl) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("wardrobe_items").insert({
        user_id: user.id,
        name: analyzedItem.name,
        category: analyzedItem.category,
        primary_color: analyzedItem.primary_color,
        color_hex: analyzedItem.color_hex,
        style_tags: analyzedItem.style_tags,
        photo_url: uploadedPhotoUrl,
        is_new: true,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
      toast.success("Item saved to your wardrobe!");
      setSaved(true);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const getItemById = (id: string) => wardrobeItems.find((i) => i.id === id);

  const isProcessing = analyzing || matching;

  return (
    <LcarsSection
      title="ACQUISITIONS"
      subtitle="SECTOR 02 · SHOPPING MODE"
      headerColor="lavender"
      topColor="lavender"
      sideColor="peach"
      bottomColor="salmon"
    >
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <p className="mt-1 text-sm text-muted-foreground">
          Snap a photo of something you're eyeing and see how it pairs with your wardrobe.
          {!isPro && " (Pro feature)"}
        </p>
      </div>

      {/* Pro gate */}
      {!isPro ? (
        <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
          <div className="empty-state-blob">
            <div className="flex h-20 w-20 items-center justify-center rounded-full glass-card relative z-10">
              <Crown className="h-8 w-8 text-neon-cyan" />
            </div>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">Pro Feature</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Shopping Mode uses AI to analyze clothing items and match them with your wardrobe. Upgrade to Pro to unlock this feature.
            </p>
          </div>
          <Button variant="neon" onClick={() => navigate("/pricing")} className="gap-2">
            <Crown className="h-4 w-4" />
            Upgrade to Pro
          </Button>
        </div>
      ) : (
        <>

      {/* Photo area */}
      {photoPreview ? (
        <div className="relative">
          <img
            src={photoPreview}
            alt="Shopping item"
            className="w-full max-h-64 rounded-xl object-cover"
          />
          <button
            onClick={reset}
            className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur p-1.5"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>

          {/* Analyzed badge */}
          {analyzedItem && (
            <div className="mt-3 glass-panel gradient-border rounded-xl p-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{analyzedItem.category}</Badge>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: analyzedItem.color_hex }}
                />
                <span className="text-sm text-muted-foreground">{analyzedItem.primary_color}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{analyzedItem.name}</span>
          </div>
          )}

          {/* Save to Wardrobe button */}
          {analyzedItem && (
            <div className="mt-3">
              <Button
                size="sm"
                variant={saved ? "secondary" : "outline"}
                disabled={saving || saved}
                onClick={handleSaveToWardrobe}
                className="gap-1.5"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {saved ? "Saved to Wardrobe" : "Save to Wardrobe"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-full gap-3 relative">
          <div className="gradient-blob gradient-blob-cyan absolute -top-8 -left-8 w-32 h-32 opacity-30" />
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl glass-card p-8 transition-all hover:shadow-neon relative z-10"
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Take Photo</span>
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl glass-card p-8 transition-all hover:shadow-neon relative z-10"
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Upload</span>
          </button>
        </div>
      )}

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Action button */}
      {photoPreview && outfits.length === 0 && (
        <Button onClick={handleAnalyzeAndMatch} disabled={isProcessing} variant="neon" className="w-full gap-2" size="lg">
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {analyzing ? "Analyzing item…" : "Finding outfit matches…"}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Find Wardrobe Matches
            </>
          )}
        </Button>
      )}

      {/* Results */}
      {outfits.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Outfit Ideas with This Item
          </h3>
          {outfits.map((outfit, idx) => (
            <div key={idx} className="rounded-xl glass-card hover-lift p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-semibold text-card-foreground">
                  {outfit.name}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {moodEmoji[outfit.mood] || "👔"} {outfit.mood}
                </Badge>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {outfit.item_ids.map((id) => {
                  if (id === "shop-item") {
                    return (
                      <div key={id} className="shrink-0 w-20 rounded-lg overflow-hidden border-2 border-primary glass-card">
                        <div className="aspect-square w-full overflow-hidden">
                          <img src={photoPreview!} alt="Shopping item" className="h-full w-full object-cover" />
                        </div>
                        <p className="truncate px-1.5 py-1 text-[10px] font-medium text-primary">
                          New Item
                        </p>
                      </div>
                    );
                  }
                  const wi = getItemById(id);
                  if (!wi) return null;
                  return (
                    <div key={id} className="shrink-0 w-20 rounded-lg overflow-hidden glass-card">
                      <div className="aspect-square w-full overflow-hidden" style={{ backgroundColor: wi.color_hex }}>
                        {wi.photo && (
                          <img src={wi.photo} alt={wi.name} className="h-full w-full object-cover" loading="lazy" />
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
          ))}

          <Button variant="outline" onClick={reset} className="w-full">
            Try Another Item
          </Button>
        </div>
      )}
      </>
      )}
    </div>
    </LcarsSection>
  );
}
