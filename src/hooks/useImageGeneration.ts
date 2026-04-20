import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { WardrobeItem } from "@/lib/wardrobe-data";

const DEFAULT_CONCURRENCY = 3;

/**
 * Generates AI product photos for wardrobe items that lack one.
 *
 * Uses a concurrency-limited worker pool (default 3) to bound wall-clock time
 * without overwhelming the upstream AI gateway's rate limits. Each successful
 * generation is persisted to wardrobe_items.photo_url, then the TanStack
 * Query cache is invalidated so consumers re-render with stored URLs instead
 * of the in-memory overlay.
 */
export function useImageGeneration(items: WardrobeItem[], concurrency = DEFAULT_CONCURRENCY) {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 });
  const [generatedPhotos, setGeneratedPhotos] = useState<Record<string, string>>({});

  const itemsWithGenerated = useMemo(
    () => items.map((item) => (generatedPhotos[item.id] ? { ...item, photo: generatedPhotos[item.id] } : item)),
    [items, generatedPhotos],
  );

  const itemsMissingPhotos = useMemo(
    () => itemsWithGenerated.filter((i) => !i.photo),
    [itemsWithGenerated],
  );

  const generateMissing = useCallback(async () => {
    if (generating) return;
    const missing = itemsMissingPhotos;
    if (missing.length === 0) {
      toast("All items already have photos!");
      return;
    }

    setGenerating(true);
    setGenProgress({ current: 0, total: missing.length });
    let completed = 0;

    const generateOne = async (item: WardrobeItem) => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-clothing-image", {
          body: { name: item.name, category: item.category, primary_color: item.primary_color },
        });
        if (error) throw error;
        if (data?.url) {
          setGeneratedPhotos((prev) => ({ ...prev, [item.id]: data.url }));
          await supabase.from("wardrobe_items").update({ photo_url: data.url }).eq("id", item.id);
          toast.success(`Generated image for ${item.name}`);
        }
      } catch (err: any) {
        console.error(`Failed to generate image for ${item.name}:`, err);
        toast.error(`Failed: ${item.name}`);
      } finally {
        completed += 1;
        setGenProgress({ current: completed, total: missing.length });
      }
    };

    for (let i = 0; i < missing.length; i += concurrency) {
      const batch = missing.slice(i, i + concurrency);
      await Promise.all(batch.map(generateOne));
    }

    queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
    setGenerating(false);
  }, [generating, itemsMissingPhotos, concurrency, queryClient]);

  return {
    generating,
    genProgress,
    itemsWithGenerated,
    itemsMissingPhotos,
    generateMissing,
  };
}
