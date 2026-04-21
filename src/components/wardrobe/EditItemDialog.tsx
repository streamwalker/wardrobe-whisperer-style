import { useState, useRef } from "react";
import { SHOE_SUBCATEGORIES, ACCESSORY_SUBCATEGORIES } from "@/lib/wardrobe-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Camera, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PATTERN_OPTIONS, TEXTURE_OPTIONS, type WardrobeItem } from "@/lib/wardrobe-data";

const CATEGORIES = ["shoes", "pants", "tops", "outerwear", "suits", "accessories", "dress-shoes"] as const;
const STYLE_TAGS = ["casual", "neutral", "bold", "luxury", "minimal", "sporty"] as const;

interface Props {
  item: WardrobeItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: {
    name: string;
    category: string;
    subcategory?: string;
    primary_color: string;
    color_hex: string;
    style_tags: string[];
    pattern?: string;
    texture?: string;
    newPhotoFile?: File;
    newBackPhotoFile?: File;
    removeBackPhoto?: boolean;
  }) => Promise<void>;
}

export default function EditItemDialog({ item, open, onOpenChange, onSave }: Props) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<string>(item.category);
  const [subcategory, setSubcategory] = useState<string>(item.subcategory || "");
  const [primaryColor, setPrimaryColor] = useState(item.primary_color);
  const [colorHex, setColorHex] = useState(item.color_hex);
  const [styleTags, setStyleTags] = useState<string[]>([...item.style_tags]);
  const [pattern, setPattern] = useState<string>(item.pattern || "");
  const [texture, setTexture] = useState<string>(item.texture || "");
  const [saving, setSaving] = useState(false);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newBackPhotoFile, setNewBackPhotoFile] = useState<File | null>(null);
  const [backPhotoPreview, setBackPhotoPreview] = useState<string | null>(null);
  const [removeBackPhoto, setRemoveBackPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: string) => {
    setStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewPhotoFile(file);
    // Revoke previous preview to avoid memory leak
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleBackPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewBackPhotoFile(file);
    setRemoveBackPhoto(false);
    if (backPhotoPreview) URL.revokeObjectURL(backPhotoPreview);
    setBackPhotoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!name.trim() || !category || !primaryColor.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        subcategory: (category === "shoes" || category === "accessories") && subcategory ? subcategory : undefined,
        primary_color: primaryColor.trim(),
        color_hex: colorHex,
        style_tags: styleTags,
        pattern: pattern || undefined,
        texture: texture || undefined,
        newPhotoFile: newPhotoFile ?? undefined,
        newBackPhotoFile: newBackPhotoFile ?? undefined,
        removeBackPhoto: removeBackPhoto || undefined,
      });
      onOpenChange(false);
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(item.name);
      setCategory(item.category);
      setSubcategory(item.subcategory || "");
      setPrimaryColor(item.primary_color);
      setColorHex(item.color_hex);
      setStyleTags([...item.style_tags]);
      setPattern(item.pattern || "");
      setTexture(item.texture || "");
      setNewPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setNewBackPhotoFile(null);
      if (backPhotoPreview) URL.revokeObjectURL(backPhotoPreview);
      setBackPhotoPreview(null);
      setRemoveBackPhoto(false);
    }
    onOpenChange(nextOpen);
  };

  const displayPhoto = photoPreview || item.photo;
  const displayBackPhoto = backPhotoPreview || (removeBackPhoto ? null : item.photo_back);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {/* Side-by-side front/back photos */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              {/* FRONT */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-[11px] font-medium text-muted-foreground">Front</p>
                <div
                  className="relative w-full aspect-square rounded-lg overflow-hidden border"
                  style={{ backgroundColor: colorHex }}
                >
                  {displayPhoto ? (
                    <img src={displayPhoto} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <ImageIcon className="h-3 w-3" />
                    {displayPhoto ? "Replace" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <Camera className="h-3 w-3" />
                    Camera
                  </button>
                </div>
              </div>

              {/* BACK */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-[11px] font-medium text-muted-foreground">Back (optional)</p>
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-muted/30">
                  {displayBackPhoto ? (
                    <img src={displayBackPhoto} alt="Back" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => backFileInputRef.current?.click()}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <ImageIcon className="h-3 w-3" />
                    {displayBackPhoto ? "Replace" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => backCameraInputRef.current?.click()}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <Camera className="h-3 w-3" />
                    Camera
                  </button>
                  {displayBackPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        if (backPhotoPreview) URL.revokeObjectURL(backPhotoPreview);
                        setBackPhotoPreview(null);
                        setNewBackPhotoFile(null);
                        setRemoveBackPhoto(true);
                      }}
                      className="flex items-center gap-1 text-[11px] text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <input
              ref={backFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackPhotoSelect}
            />
            <input
              ref={backCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleBackPhotoSelect}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(val) => { setCategory(val); if (val !== "shoes" && val !== "accessories") setSubcategory(""); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize text-sm">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(category === "shoes" || category === "accessories") && (
            <div className="space-y-1.5">
              <Label className="text-xs">Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {(category === "shoes" ? SHOE_SUBCATEGORIES : ACCESSORY_SUBCATEGORIES).map((sub) => (
                    <SelectItem key={sub.value} value={sub.value} className="text-sm">
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="e.g. Navy"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hex</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded border border-input shrink-0"
                />
                <Input
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Pattern</Label>
              <Select value={pattern} onValueChange={setPattern}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {PATTERN_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize text-sm">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Texture</Label>
              <Select value={texture} onValueChange={setTexture}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {TEXTURE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize text-sm">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 pb-2">
            <Label className="text-xs">Style Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition-colors",
                    styleTags.includes(tag)
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-border/40 bg-background/80 backdrop-blur-sm rounded-b-lg">
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim() || !primaryColor.trim()}
            className="w-full"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
