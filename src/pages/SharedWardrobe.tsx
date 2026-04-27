import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type WardrobeItem, type WardrobeCategory } from "@/lib/wardrobe-data";
import WardrobeItemCard from "@/components/wardrobe/WardrobeItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { cn } from "@/lib/utils";
import LcarsStandaloneShell from "@/components/lcars/LcarsStandaloneShell";

export default function SharedWardrobe() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<WardrobeCategory | "all">("all");

  const { data: ownerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["shared-profile", token],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_shared_profile", { p_token: token! });
      if (error) throw error;
      const rows = data as unknown as { display_name: string }[];
      if (!rows || rows.length === 0) throw new Error("Share not found or expired");
      return rows[0];
    },
    enabled: !!token,
  });

  const { data: items, isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ["shared-items", token],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_shared_wardrobe", { p_token: token! });
      if (error) throw error;
      return data as unknown as Array<{
        id: string; name: string; category: string; primary_color: string;
        color_hex: string | null; style_tags: string[] | null;
        is_new: boolean | null; is_featured: boolean | null; photo_url: string | null;
      }>;
    },
    enabled: !!token,
  });

  const wardrobeItems: WardrobeItem[] = (items || []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category as WardrobeCategory,
    primary_color: row.primary_color,
    color_hex: row.color_hex || "#888888",
    style_tags: (row.style_tags || []) as WardrobeItem["style_tags"],
    is_new: row.is_new ?? false,
    is_featured: row.is_featured ?? false,
    photo: row.photo_url || undefined,
  }));

  const filtered =
    activeCategory === "all"
      ? wardrobeItems
      : wardrobeItems.filter((i) => i.category === activeCategory);

  const ownerName = ownerProfile?.display_name || "Someone";

  if (profileLoading || itemsLoading) {
    return (
      <LcarsStandaloneShell
        title="GUEST ACCESS"
        subtitle="LOADING WARDROBE"
        headerColor="cyan"
      >
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </LcarsStandaloneShell>
    );
  }

  if (itemsError || !items) {
    return (
      <LcarsStandaloneShell
        title="ACCESS DENIED"
        subtitle="LINK INVALID OR EXPIRED"
        headerColor="red"
        topColor="red"
        sideColor="yellow"
        bottomColor="orange"
      >
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="text-lg font-medium text-foreground">This wardrobe link is invalid or expired.</p>
          <button
            onClick={() => navigate("/")}
            className="lcars-pill bg-lcars-cyan text-black px-4 h-9 inline-flex items-center lcars-label text-xs hover:brightness-110"
          >
            RETURN TO BASE
          </button>
        </div>
      </LcarsStandaloneShell>
    );
  }

  return (
    <LcarsStandaloneShell
      title={`${ownerName.toUpperCase()} • GUEST WARDROBE`}
      subtitle={`${wardrobeItems.length} UNITS · READ-ONLY`}
      headerColor="cyan"
      topColor="cyan"
      sideColor="lavender"
      bottomColor="salmon"
      maxWidth="xl"
    >
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors lcars-label",
              activeCategory === "all"
                ? "bg-lcars-orange text-black"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            ALL
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors lcars-label",
                activeCategory === cat.value
                  ? "bg-lcars-orange text-black"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <WardrobeItemCard key={item.id} item={item} selected={false} onClick={() => {}} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">No items to show.</p>
        )}
      </div>
    </LcarsStandaloneShell>
  );
}
