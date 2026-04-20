import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_DRESS_SHIRTS } from "@/lib/default-wardrobe-items";
import type { WardrobeCategory, WardrobeItem } from "@/lib/wardrobe-data";

/**
 * Fetches the authenticated user's wardrobe items, maps the DB shape to the
 * client-facing WardrobeItem shape, and auto-seeds default dress shirts into
 * a brand-new (empty) wardrobe on first load.
 *
 * Consumed by: Wardrobe, Shop, Outfits, AddItem, BatchAddItems, and the
 * transfer/export dialogs. Extracted so the mapping and seeding logic
 * stop being duplicated across pages.
 */
export function useWardrobeItems(userId: string | undefined) {
  const queryClient = useQueryClient();
  const seededRef = useRef(false);

  const query = useQuery({
    queryKey: ["wardrobe-items", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: dbItems, isLoading } = query;

  // Seed defaults exactly once for users whose wardrobe returns an empty array
  useEffect(() => {
    if (!userId || isLoading || seededRef.current) return;
    if (dbItems && dbItems.length === 0) {
      seededRef.current = true;
      const seedItems = DEFAULT_DRESS_SHIRTS.map((item) => ({ ...item, user_id: userId }));
      supabase
        .from("wardrobe_items")
        .insert(seedItems)
        .then(({ error }) => {
          if (error) {
            console.error("Failed to seed default items:", error);
          } else {
            queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
          }
        });
    }
  }, [userId, dbItems, isLoading, queryClient]);

  const items: WardrobeItem[] = (dbItems ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category as WardrobeCategory,
    subcategory: row.subcategory || undefined,
    primary_color: row.primary_color,
    color_hex: row.color_hex || "#888888",
    style_tags: (row.style_tags || []) as WardrobeItem["style_tags"],
    pattern: row.pattern || undefined,
    texture: row.texture || undefined,
    is_new: row.is_new ?? false,
    is_featured: row.is_featured ?? false,
    photo: row.photo_url || undefined,
  }));

  return { items, isLoading, rawDbItems: dbItems };
}
