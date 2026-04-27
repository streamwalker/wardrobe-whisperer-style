import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SHOE_SUBCATEGORIES, ACCESSORY_SUBCATEGORIES, PATTERN_OPTIONS, TEXTURE_OPTIONS } from "@/lib/wardrobe-data";
import { ArrowLeft, Camera, Loader2, Sparkles, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import OutfitSuggestionDrawer from "@/components/wardrobe/OutfitSuggestionDrawer";
import { useWardrobeItems } from "@/hooks/useWardrobeItems";
import type { WardrobeItem } from "@/lib/wardrobe-data";
import { LcarsSection } from "@/components/lcars/LcarsSection";
import { LcarsPill } from "@/components/lcars/LcarsPrimitives";

const CATEGORIES = ["shoes", "pants", "tops", "outerwear", "suits", "accessories", "dress-shoes"] as const;
const STYLE_TAGS = ["casual", "neutral", "bold", "luxury", "minimal", "sporty"] as const;

export default function AddItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);
  const backGalleryInputRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [backPhotoFile, setBackPhotoFile] = useState<File | null>(null);
  const [backPhotoPreview, setBackPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [newlyAddedItem, setNewlyAddedItem] = useState<WardrobeItem | null>(null);

  const { items: allItems } = useWardrobeItems(user?.id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState<string>("");
  const [pattern, setPattern] = useState<string>("");
  const [texture, setTexture] = useState<string>("");

  // Prefill from query params (e.g. /add?category=tops&name=White%20Oxford&hint=...)
  useEffect(() => {
    const qpCategory = searchParams.get("category");
    const qpName = searchParams.get("name");
    const qpHint = searchParams.get("hint");
    if (qpCategory && (CATEGORIES as readonly string[]).includes(qpCategory)) {
      setCategory(qpCategory);
    }
    if (qpName) setName(qpName);
    if (qpHint) setDescription((prev) => (prev ? prev : qpHint));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzePhoto = useCallback(async (file: File, backFile?: File | null) => {
    if (!user) return;
    setAnalyzing(true);
    try {
      const uploadOne = async (f: File, suffix = "") => {
        const ext = f.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/${Date.now()}${suffix}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("wardrobe-photos")
          .upload(filePath, f);
        if (uploadError) throw uploadError;
        return supabase.storage.from("wardrobe-photos").getPublicUrl(filePath).data.publicUrl;
      };

      const frontUrl = await uploadOne(file);
      const backUrl = backFile ? await uploadOne(backFile, "-back-analyze") : null;

      const { data, error } = await supabase.functions.invoke("analyze-clothing", {
        body: { imageUrl: frontUrl, backImageUrl: backUrl ?? undefined },
      });

      if (error) throw error;

      if (data.error) {
        toast({ title: "Analysis failed", description: data.error, variant: "destructive" });
      } else {
        setName(data.name || "");
        const baseDesc = data.description || "";
        const back = (data.back_details || "").trim();
        setDescription(back ? `${baseDesc}${baseDesc ? " " : ""}Back: ${back}` : baseDesc);
        setCategory(data.category || "");
        setPrimaryColor(data.primary_color || "");
        setColorHex(data.color_hex || "#000000");
        setStyleTags(data.style_tags || []);
        setPattern(data.pattern || "");
        setTexture(data.texture || "");
      }
    } catch (err: any) {
      console.error("Upload/analyze error:", err);
      toast({ title: "Error", description: err.message || "Failed to analyze photo", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    analyzePhoto(file);
  };

  const handleBackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (backPhotoPreview) URL.revokeObjectURL(backPhotoPreview);
    setBackPhotoFile(file);
    setBackPhotoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const toggleTag = (tag: string) => {
    setStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!name || !category || !primaryColor) {
      toast({ title: "Missing fields", description: "Please fill in name, category, and color.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const uploadPhoto = async (file: File, suffix = "") => {
        const ext = file.name.split(".").pop() || "jpg";
        const filePath = `${user!.id}/${Date.now()}${suffix}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("wardrobe-photos")
          .upload(filePath, file);
        if (uploadError && !uploadError.message.includes("already exists")) {
          throw uploadError;
        }
        const { data: urlData } = supabase.storage
          .from("wardrobe-photos")
          .getPublicUrl(filePath);
        return urlData.publicUrl;
      };

      let photoUrl: string | null = null;
      let photoBackUrl: string | null = null;
      if (photoFile) photoUrl = await uploadPhoto(photoFile);
      if (backPhotoFile) photoBackUrl = await uploadPhoto(backPhotoFile, "-back");

      const { data: inserted, error: insertError } = await supabase
        .from("wardrobe_items")
        .insert({
          user_id: user!.id,
          name,
          description: description || null,
          category,
          subcategory: (category === "shoes" || category === "accessories") && subcategory ? subcategory : null,
          primary_color: primaryColor,
          color_hex: colorHex,
          style_tags: styleTags,
          pattern: pattern || null,
          texture: texture || null,
          photo_url: photoUrl,
          photo_back_url: photoBackUrl,
          is_new: true,
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      toast({ title: "Item added!", description: `${name} saved to your wardrobe.` });
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });

      // Auto-open outfit suggestions if there are enough other items to pair with
      if (inserted && allItems.length >= 2) {
        const newItem: WardrobeItem = {
          id: (inserted as any).id,
          name: (inserted as any).name,
          category: (inserted as any).category,
          subcategory: (inserted as any).subcategory || undefined,
          primary_color: (inserted as any).primary_color,
          color_hex: (inserted as any).color_hex || "#888888",
          style_tags: ((inserted as any).style_tags || []) as WardrobeItem["style_tags"],
          pattern: (inserted as any).pattern || undefined,
          texture: (inserted as any).texture || undefined,
          is_new: true,
          is_featured: false,
          photo: (inserted as any).photo_url || undefined,
          photo_back: (inserted as any).photo_back_url || undefined,
        };
        setNewlyAddedItem(newItem);
        setSuggestionOpen(true);
      } else {
        if (inserted) {
          toast({
            title: "Add a few more items",
            description: "Build up your wardrobe to start getting outfit ideas.",
          });
        }
        navigate("/wardrobe");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Save failed", description: err.message || "Could not save item", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestionClose = (open: boolean) => {
    setSuggestionOpen(open);
    if (!open) {
      navigate("/wardrobe");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/wardrobe")} className="text-muted-foreground glass-card rounded-full p-2 hover:shadow-neon transition-shadow">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display text-xl font-semibold">Add Item</h2>
      </div>

      {/* Photo upload */}
      {photoPreview ? (
        <div className="flex flex-col items-center gap-3">
          <img
            src={photoPreview}
            alt="Preview"
            className="h-48 w-48 rounded-lg object-cover"
          />
          {analyzing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing your item…</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>
            Remove photo
          </Button>
        </div>
      ) : (
        <div className="flex w-full gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl glass-card p-6 transition-all hover:shadow-neon"
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Take Photo</span>
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl glass-card p-6 transition-all hover:shadow-neon"
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Choose Photo</span>
          </button>
        </div>
      )}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={backCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleBackFileSelect}
      />
      <input
        ref={backGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBackFileSelect}
      />

      {/* Optional back photo */}
      {photoPreview && (
        <div className="glass-card rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Back photo (optional)</span>
            <span className="text-[10px] text-muted-foreground">Helps capture the full garment</span>
          </div>
          {backPhotoPreview ? (
            <div className="flex items-center gap-3">
              <img
                src={backPhotoPreview}
                alt="Back preview"
                className="h-20 w-20 rounded-lg object-cover border"
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => backGalleryInputRef.current?.click()}
                  className="h-7 text-xs"
                >
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (backPhotoPreview) URL.revokeObjectURL(backPhotoPreview);
                    setBackPhotoFile(null);
                    setBackPhotoPreview(null);
                  }}
                  className="h-7 text-xs text-destructive hover:text-destructive"
                >
                  Remove back
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={() => backCameraInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                Camera
              </button>
              <button
                type="button"
                onClick={() => backGalleryInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Choose
              </button>
            </div>
          )}
        </div>
      )}

      {/* Re-analyze button */}
      {photoPreview && !analyzing && (
        <Button onClick={() => photoFile && analyzePhoto(photoFile, backPhotoFile)} variant="neon" className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          {backPhotoFile ? "Re-analyze with back photo" : "Re-analyze"}
        </Button>
      )}

      {/* Form fields */}
      <div className="glass-card gradient-border rounded-2xl p-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Navy Chinos" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Ralph Lauren 2025 spring collection 'Joffrey' green sports jacket"
            className="min-h-[60px] resize-none"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(val) => { setCategory(val); if (val !== "shoes" && val !== "accessories") setSubcategory(""); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(category === "shoes" || category === "accessories") && (
          <div className="space-y-2">
            <Label>Subcategory</Label>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory (optional)" />
              </SelectTrigger>
              <SelectContent>
                {(category === "shoes" ? SHOE_SUBCATEGORIES : ACCESSORY_SUBCATEGORIES).map((sub) => (
                  <SelectItem key={sub.value} value={sub.value}>
                    {sub.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="e.g. Navy" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hex">Hex</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-md border border-input"
              />
              <Input id="hex" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Pattern</Label>
            <Select value={pattern} onValueChange={setPattern}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {PATTERN_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Texture</Label>
            <Select value={texture} onValueChange={setTexture}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {TEXTURE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Style Tags</Label>
          <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize transition-all",
                  styleTags.includes(tag)
                    ? "neon-gradient-cyan-pink text-white shadow-neon"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || analyzing} className="w-full" size="lg">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save to Wardrobe
      </Button>

      {newlyAddedItem && (
        <OutfitSuggestionDrawer
          open={suggestionOpen}
          onOpenChange={handleSuggestionClose}
          items={[newlyAddedItem]}
          allWardrobeItems={[...allItems, newlyAddedItem]}
          headline="Fresh addition to your wardrobe ✨"
          subheadline={`Here's how ${newlyAddedItem.name} works with what you already own.`}
        />
      )}
    </div>
  );
}
