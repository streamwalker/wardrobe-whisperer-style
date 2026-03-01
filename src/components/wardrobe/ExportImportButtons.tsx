import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DEMO_WARDROBE, type WardrobeItem } from "@/lib/wardrobe-data";

interface ExportImportButtonsProps {
  userId: string;
  allItems: WardrobeItem[];
}

interface ExportPayload {
  version: number;
  exportedAt: string;
  items: {
    name: string;
    category: string;
    primary_color: string;
    color_hex: string;
    style_tags: string[];
    is_new: boolean;
    is_featured: boolean;
    photo_url: string | null;
  }[];
}

export default function ExportImportButtons({ userId, allItems }: ExportImportButtonsProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const payload: ExportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: allItems.map((item) => ({
        name: item.name,
        category: item.category,
        primary_color: item.primary_color,
        color_hex: item.color_hex,
        style_tags: [...item.style_tags],
        is_new: item.is_new,
        is_featured: item.is_featured,
        photo_url: item.photo ?? null,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `wardrobe-export-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${payload.items.length} items`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so same file can be re-selected
    e.target.value = "";

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportPayload;

      if (!data.version || !Array.isArray(data.items)) {
        throw new Error("Invalid wardrobe JSON format");
      }

      const valid = data.items.filter((item) => item.name && item.category && item.primary_color);
      const skipped = data.items.length - valid.length;

      if (valid.length === 0) {
        toast.error("No valid items found in file");
        return;
      }

      // Batch insert in chunks of 50
      const BATCH = 50;
      let inserted = 0;
      for (let i = 0; i < valid.length; i += BATCH) {
        const batch = valid.slice(i, i + BATCH).map((item) => ({
          user_id: userId,
          name: item.name,
          category: item.category,
          primary_color: item.primary_color,
          color_hex: item.color_hex || null,
          style_tags: item.style_tags || [],
          is_new: item.is_new ?? false,
          is_featured: item.is_featured ?? false,
          photo_url: item.photo_url || null,
        }));

        const { error } = await supabase.from("wardrobe_items").insert(batch);
        if (error) throw error;
        inserted += batch.length;
      }

      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
      toast.success(`Imported ${inserted} items${skipped > 0 ? ` (${skipped} skipped)` : ""}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to import");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
      >
        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Import
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
    </>
  );
}
