import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, ImageIcon, Loader2, Sparkles, X, Check } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const CATEGORIES = ["shoes", "pants", "tops", "outerwear", "suits", "accessories"] as const;
const STYLE_TAGS = ["casual", "neutral", "bold", "luxury", "minimal", "sporty"] as const;

interface BatchItem {
  id: string;
  file: File;
  preview: string;
  name: string;
  category: string;
  primaryColor: string;
  colorHex: string;
  styleTags: string[];
  pattern: string;
  texture: string;
  analyzing: boolean;
  analyzed: boolean;
  saving: boolean;
  saved: boolean;
}

let itemCounter = 0;

export default function BatchAddItems() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<BatchItem[]>([]);
  const [savingAll, setSavingAll] = useState(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: BatchItem[] = files.map((file) => ({
      id: `batch-${++itemCounter}`,
      file,
      preview: URL.createObjectURL(file),
      name: "",
      category: "",
      primaryColor: "",
      colorHex: "#888888",
      styleTags: [],
      pattern: "",
      texture: "",
      analyzing: false,
      analyzed: false,
      saving: false,
      saved: false,
    }));

    setItems((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    const newItems: BatchItem[] = imageFiles.map((file) => ({
      id: `batch-${++itemCounter}`,
      file,
      preview: URL.createObjectURL(file),
      name: "",
      category: "",
      primaryColor: "",
      colorHex: "#888888",
      styleTags: [],
      pattern: "",
      texture: "",
      analyzing: false,
      analyzed: false,
      saving: false,
      saved: false,
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const toggleTag = (itemId: string, tag: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const tags = item.styleTags.includes(tag)
          ? item.styleTags.filter((t) => t !== tag)
          : [...item.styleTags, tag];
        return { ...item, styleTags: tags };
      })
    );
  };

  const analyzeItem = async (item: BatchItem) => {
    if (!user) return;
    updateItem(item.id, { analyzing: true });
    try {
      const ext = item.file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}-${item.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("wardrobe-photos")
        .upload(filePath, item.file);
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
        updateItem(item.id, {
          name: data.name || "",
          category: data.category || "",
          primaryColor: data.primary_color || "",
          colorHex: data.color_hex || "#888888",
          styleTags: data.style_tags || [],
          pattern: data.pattern || "",
          texture: data.texture || "",
          analyzed: true,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to analyze", variant: "destructive" });
    } finally {
      updateItem(item.id, { analyzing: false });
    }
  };

  const handleAnalyzeAll = async () => {
    const unanalyzed = items.filter((i) => !i.analyzed && !i.analyzing);
    if (unanalyzed.length === 0) return;
    setAnalyzingAll(true);
    for (const item of unanalyzed) {
      await analyzeItem(item);
    }
    setAnalyzingAll(false);
  };

  const saveItem = async (item: BatchItem): Promise<boolean> => {
    if (!user || !item.name || !item.category || !item.primaryColor) return false;
    updateItem(item.id, { saving: true });
    try {
      let photoUrl: string | null = null;
      const ext = item.file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}-save-${item.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("wardrobe-photos")
        .upload(filePath, item.file);

      if (uploadError && !uploadError.message.includes("already exists")) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("wardrobe-photos")
        .getPublicUrl(filePath);
      photoUrl = urlData.publicUrl;

      const { error: insertError } = await supabase.from("wardrobe_items").insert({
        user_id: user.id,
        name: item.name,
        category: item.category,
        primary_color: item.primaryColor,
        color_hex: item.colorHex,
        style_tags: item.styleTags,
        pattern: item.pattern || null,
        texture: item.texture || null,
        photo_url: photoUrl,
        is_new: true,
      } as any);

      if (insertError) throw insertError;
      updateItem(item.id, { saved: true, saving: false });
      return true;
    } catch (err: any) {
      toast({ title: "Save failed", description: `${item.name || "Item"}: ${err.message}`, variant: "destructive" });
      updateItem(item.id, { saving: false });
      return false;
    }
  };

  const handleSaveAll = async () => {
    const toSave = items.filter((i) => !i.saved);
    const incomplete = toSave.filter((i) => !i.name || !i.category || !i.primaryColor);
    if (incomplete.length > 0) {
      toast({
        title: "Missing fields",
        description: `${incomplete.length} item(s) need name, category, and color filled in.`,
        variant: "destructive",
      });
      return;
    }

    setSavingAll(true);
    let successCount = 0;
    for (const item of toSave) {
      const ok = await saveItem(item);
      if (ok) successCount++;
    }
    setSavingAll(false);

    if (successCount > 0) {
      toast({ title: "Batch saved!", description: `${successCount} item(s) added to your wardrobe.` });
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
    }
    if (successCount === toSave.length) {
      navigate("/wardrobe");
    }
  };

  const unsavedCount = items.filter((i) => !i.saved).length;
  const readyToSave = items.filter((i) => !i.saved && i.name && i.category && i.primaryColor).length;
  const unanalyzedCount = items.filter((i) => !i.analyzed && !i.analyzing).length;

  return (
    <div
      ref={dropZoneRef}
      className="space-y-5 pb-28"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/wardrobe")} className="text-muted-foreground glass-card rounded-full p-2 hover:shadow-neon transition-shadow">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="font-display text-xl font-semibold">Batch Add Items</h2>
          <p className="text-xs text-muted-foreground">Select, take, or drag & drop photos</p>
        </div>
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary p-12 glass-card">
            <ImageIcon className="h-12 w-12 text-primary" />
            <p className="text-lg font-medium text-primary">Drop photos here</p>
          </div>
        </div>
      )}

      {/* Photo selection */}
      <div className="flex gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl glass-card p-5 transition-all hover:shadow-neon"
        >
          <ImageIcon className="h-7 w-7 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Choose Photos</span>
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl glass-card p-5 transition-all hover:shadow-neon"
        >
          <Camera className="h-7 w-7 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Take Photo</span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFilesSelect}
      />

      {/* Batch action buttons */}
      {items.length > 0 && (
        <div className="flex gap-2">
          {unanalyzedCount > 0 && (
            <Button
              variant="neon"
              size="sm"
              className="gap-1.5"
              onClick={handleAnalyzeAll}
              disabled={analyzingAll}
            >
              {analyzingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analyze All ({unanalyzedCount})
            </Button>
          )}
          <span className="text-xs text-muted-foreground self-center ml-auto">
            {items.length} photo{items.length !== 1 ? "s" : ""} · {readyToSave} ready
          </span>
        </div>
      )}

      {/* Item cards grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="empty-state-blob">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-3 relative z-10" />
          </div>
          <p className="text-sm text-muted-foreground mt-3">Select photos to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <BatchItemCard
              key={item.id}
              item={item}
              onUpdate={(updates) => updateItem(item.id, updates)}
              onRemove={() => removeItem(item.id)}
              onAnalyze={() => analyzeItem(item)}
              onToggleTag={(tag) => toggleTag(item.id, tag)}
            />
          ))}
        </div>
      )}

      {/* Floating save bar */}
      {unsavedCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
          <div className="mx-auto max-w-lg">
            <Button
              onClick={handleSaveAll}
              disabled={savingAll || readyToSave === 0}
              className="w-full shadow-lg neon-gradient-cyan-pink text-white shadow-neon"
              size="lg"
            >
              {savingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save All ({readyToSave}) to Wardrobe
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Batch Item Card ─────────────────────────────────── */

interface BatchItemCardProps {
  item: BatchItem;
  onUpdate: (updates: Partial<BatchItem>) => void;
  onRemove: () => void;
  onAnalyze: () => void;
  onToggleTag: (tag: string) => void;
}

function BatchItemCard({ item, onUpdate, onRemove, onAnalyze, onToggleTag }: BatchItemCardProps) {
  const [expanded, setExpanded] = useState(true);

  if (item.saved) {
    return (
      <div className="flex items-center gap-3 rounded-xl glass-card p-3">
        <img src={item.preview} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
        </div>
        <Check className="h-5 w-5 text-primary shrink-0" />
      </div>
    );
  }

  return (
    <div className="rounded-xl glass-card gradient-border overflow-hidden">
      {/* Top bar: thumbnail + name + actions */}
      <div className="flex items-center gap-3 p-3">
        <img
          src={item.preview}
          alt="Preview"
          className="h-16 w-16 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <Input
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Item name"
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Select value={item.category} onValueChange={(v) => onUpdate({ category: v })}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!item.analyzed && (
              <Button
                variant="neon"
                size="sm"
                className="h-7 text-xs gap-1 px-2"
                onClick={onAnalyze}
                disabled={item.analyzing}
              >
                {item.analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                AI
              </Button>
            )}
          </div>
        </div>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive shrink-0 self-start">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-xs text-muted-foreground px-3 py-1.5 border-t border-border/30 bg-muted/10 text-center hover:bg-muted/20 transition-colors"
      >
        {expanded ? "Hide details" : "Show details"}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-2 space-y-3 border-t border-border/30">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input
                value={item.primaryColor}
                onChange={(e) => onUpdate({ primaryColor: e.target.value })}
                placeholder="e.g. Navy"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hex</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={item.colorHex}
                  onChange={(e) => onUpdate({ colorHex: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded border border-input shrink-0"
                />
                <Input
                  value={item.colorHex}
                  onChange={(e) => onUpdate({ colorHex: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Style Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition-all",
                    item.styleTags.includes(tag)
                      ? "neon-gradient-cyan-pink text-white shadow-neon"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
