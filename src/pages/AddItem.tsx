import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SHOE_SUBCATEGORIES, ACCESSORY_SUBCATEGORIES } from "@/lib/wardrobe-data";
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

const CATEGORIES = ["shoes", "pants", "tops", "outerwear", "suits", "accessories"] as const;
const STYLE_TAGS = ["casual", "neutral", "bold", "luxury", "minimal", "sporty"] as const;

export default function AddItem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState<string>("");

  const analyzePhoto = useCallback(async (file: File) => {
    if (!user) return;
    setAnalyzing(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("wardrobe-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("wardrobe-photos")
        .getPublicUrl(filePath);

      const { data, error } = await supabase.functions.invoke("analyze-clothing", {
        body: { imageUrl: urlData.publicUrl },
      });

      if (error) throw error;

      if (data.error) {
        toast({ title: "Analysis failed", description: data.error, variant: "destructive" });
      } else {
        setName(data.name || "");
        setDescription(data.description || "");
        setCategory(data.category || "");
        setPrimaryColor(data.primary_color || "");
        setColorHex(data.color_hex || "#000000");
        setStyleTags(data.style_tags || []);
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
    // Auto-analyze on photo selection
    analyzePhoto(file);
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
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const filePath = `${user!.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("wardrobe-photos")
          .upload(filePath, photoFile);

        if (uploadError && !uploadError.message.includes("already exists")) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("wardrobe-photos")
          .getPublicUrl(filePath);

        photoUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("wardrobe_items").insert({
        user_id: user!.id,
        name,
        description: description || null,
        category,
        subcategory: (category === "shoes" || category === "accessories") && subcategory ? subcategory : null,
        primary_color: primaryColor,
        color_hex: colorHex,
        style_tags: styleTags,
        photo_url: photoUrl,
        is_new: true,
      });

      if (insertError) throw insertError;

      toast({ title: "Item added!", description: `${name} saved to your wardrobe.` });
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
      navigate("/wardrobe");
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Save failed", description: err.message || "Could not save item", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/wardrobe")} className="text-muted-foreground">
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
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/40 p-6 transition-colors hover:bg-muted/60"
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Take Photo</span>
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/40 p-6 transition-colors hover:bg-muted/60"
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

      {/* Re-analyze button (if user wants to retry) */}
      {photoPreview && !analyzing && (
        <Button onClick={() => photoFile && analyzePhoto(photoFile)} variant="secondary" className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Re-analyze
        </Button>
      )}

      {/* Form fields */}
      <div className="space-y-4">
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

        <div className="space-y-2">
          <Label>Style Tags</Label>
          <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  styleTags.includes(tag)
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || analyzing} className="w-full mb-[env(safe-area-inset-bottom,0px)]" size="lg">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save to Wardrobe
      </Button>
    </div>
  );
}
