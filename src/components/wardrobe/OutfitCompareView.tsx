import { useState } from "react";
import { type WardrobeItem } from "@/lib/wardrobe-data";
import { ArrowRight, Check, ZoomIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ZoomableImage from "./ZoomableImage";

interface Props {
  /** The seed item(s) the user picked / matched against. */
  seedItems: WardrobeItem[];
  /** Full list of items in the recommended outfit (may include the seed). */
  recommendedItems: WardrobeItem[];
  seedLabel?: string;
  recommendedLabel?: string;
}

const ZONE_ORDER = ["outerwear", "tops", "suits", "pants", "shoes", "dress-shoes", "accessories"] as const;

function categoryLabel(cat: string): string {
  switch (cat) {
    case "tops":
      return "Top";
    case "pants":
      return "Bottom";
    case "suits":
      return "Suit";
    case "dress-shoes":
      return "Dress shoes";
    case "shoes":
      return "Shoes";
    case "outerwear":
      return "Outerwear";
    case "accessories":
      return "Accessory";
    default:
      return cat;
  }
}

function sortByZone(items: WardrobeItem[]) {
  return [...items].sort((a, b) => {
    const ai = ZONE_ORDER.indexOf(a.category as (typeof ZONE_ORDER)[number]);
    const bi = ZONE_ORDER.indexOf(b.category as (typeof ZONE_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function Tile({
  item,
  badge,
  onZoom,
}: {
  item: WardrobeItem;
  badge?: { label: string; tone: "seed" | "kept" | "new" };
  onZoom: (item: WardrobeItem) => void;
}) {
  const hasPhoto = !!item.photo;
  const toneClass =
    badge?.tone === "seed"
      ? "bg-accent/90 text-accent-foreground"
      : badge?.tone === "kept"
        ? "bg-primary/90 text-primary-foreground"
        : "bg-secondary/90 text-secondary-foreground";

  return (
    <button
      type="button"
      onClick={() => hasPhoto && onZoom(item)}
      disabled={!hasPhoto}
      aria-label={hasPhoto ? `Zoom ${item.name}` : item.name}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/40 bg-secondary text-left transition-transform sm:hover:scale-[1.02]"
    >
      <div
        className="relative h-40 w-full sm:h-44"
        style={{ backgroundColor: item.color_hex }}
      >
        {hasPhoto ? (
          <img
            src={item.photo}
            alt={item.name}
            className="h-full w-full object-contain p-2"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground/70">
            No photo
          </div>
        )}

        {badge && (
          <span
            className={`absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur-sm ${toneClass}`}
          >
            {badge.tone === "kept" && <Check className="h-2.5 w-2.5" />}
            {badge.label}
          </span>
        )}

        {hasPhoto && (
          <span className="pointer-events-none absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <ZoomIn className="h-2.5 w-2.5" />
            Zoom
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5 px-2 py-1.5">
        <p className="truncate text-xs font-medium text-card-foreground">{item.name}</p>
        <p className="text-[10px] capitalize text-muted-foreground">{categoryLabel(item.category)}</p>
      </div>
    </button>
  );
}

function Column({
  title,
  items,
  emptyHint,
  badgeFor,
  onZoom,
}: {
  title: string;
  items: WardrobeItem[];
  emptyHint: string;
  badgeFor: (item: WardrobeItem) => { label: string; tone: "seed" | "kept" | "new" } | undefined;
  onZoom: (item: WardrobeItem) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <Badge variant="secondary" className="text-[10px]">
          {items.length} {items.length === 1 ? "piece" : "pieces"}
        </Badge>
      </div>
      <div className="rounded-2xl border border-border/40 bg-card/40 p-2 shadow-neon">
        {items.length === 0 ? (
          <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-border/40 bg-secondary/20 px-3 text-center">
            <p className="text-[11px] text-muted-foreground/70">{emptyHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map((it) => (
              <Tile key={it.id} item={it} badge={badgeFor(it)} onZoom={onZoom} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OutfitCompareView({
  seedItems,
  recommendedItems,
  seedLabel = "Your pick",
  recommendedLabel = "Recommended outfit",
}: Props) {
  const [zoomItem, setZoomItem] = useState<WardrobeItem | null>(null);

  const seedIds = new Set(seedItems.map((i) => i.id));
  const sortedSeed = sortByZone(seedItems);
  const sortedRecommended = sortByZone(recommendedItems);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
        <Column
          title={seedLabel}
          items={sortedSeed}
          emptyHint="No seed item selected"
          badgeFor={() => ({ label: "Seed", tone: "seed" })}
          onZoom={setZoomItem}
        />

        <div className="flex items-center justify-center text-muted-foreground sm:pt-8">
          <ArrowRight className="hidden h-5 w-5 sm:block" />
          <div className="text-center sm:hidden">
            <ArrowRight className="mx-auto h-5 w-5 rotate-90" />
          </div>
        </div>

        <Column
          title={recommendedLabel}
          items={sortedRecommended}
          emptyHint="No recommended pieces"
          badgeFor={(it) =>
            seedIds.has(it.id)
              ? { label: "Kept", tone: "kept" }
              : { label: "Add", tone: "new" }
          }
          onZoom={setZoomItem}
        />
      </div>

      <Dialog open={!!zoomItem} onOpenChange={(o) => !o && setZoomItem(null)}>
        <DialogContent className="max-w-3xl border-border/40 bg-card/95 p-3 sm:p-4">
          <DialogTitle className="font-display text-base">{zoomItem?.name ?? "Preview"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pinch, scroll, or double-tap to zoom. Drag to pan.
          </DialogDescription>
          {zoomItem?.photo && (
            <div className="mt-2 h-[60vh] w-full overflow-hidden rounded-xl border border-border/40">
              <ZoomableImage
                src={zoomItem.photo}
                alt={zoomItem.name}
                backgroundColor={zoomItem.color_hex || undefined}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
