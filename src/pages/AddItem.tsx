import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const CATEGORIES = ["shoes", "pants", "tops", "outerwear"] as const;
const STYLE_TAGS = ["casual", "neutral", "bold", "luxury", "minimal", "sporty"] as const;

export default function AddItem() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [styleTags, setStyleTags] = useState<string[]>([]);

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));

    // Upload and analyze
    setAnalyzing(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user!.id}/${Date.now()}.${ext}`;

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
      // Get photo URL if uploaded
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const filePath = `${user!.id}/${Date.now()}.${ext}`;

        // Check if already uploaded during analysis — re-use same approach
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
        category,
        primary_color: primaryColor,
        color_hex: colorHex,
        style_tags: styleTags,
        photo_url: photoUrl,
        is_new: true,
      });

      if (insertError) throw insertError;

      toast({ title: "Item added!", description: `${name} saved to your wardrobe.` });
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
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/40 p-8 transition-colors hover:bg-muted/60"
      >
        {photoPreview ? (
          <img
            src={photoPreview}
            alt="Preview"
            className="h-48 w-48 rounded-lg object-cover"
          />
        ) : (
          <>
            <Camera className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Tap to upload a photo</span>
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Analyzing spinner */}
      {analyzing && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Analyzing your item…</span>
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Navy Chinos" />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
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
