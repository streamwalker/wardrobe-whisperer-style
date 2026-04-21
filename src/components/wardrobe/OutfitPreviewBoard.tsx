import { useState } from "react";
import { type WardrobeItem, type WardrobeCategory } from "@/lib/wardrobe-data";
import { Check, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ZoomableImage from "./ZoomableImage";

interface Props {
  items: WardrobeItem[];
  highlightSharedIds?: string[];
  label?: string;
}

type Zone = "outerwear" | "top" | "bottom" | "shoes" | "accessory";

const ZONE_LABEL: Record<Zone, string> = {
  outerwear: "Outerwear",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
};

function categoryToZone(cat: WardrobeCategory): Zone {
  switch (cat) {
    case "outerwear":
      return "outerwear";
    case "tops":
      return "top";
    case "pants":
    case "suits":
      return "bottom";
    case "shoes":
    case "dress-shoes":
      return "shoes";
    case "accessories":
      return "accessory";
    default:
      return "accessory";
  }
}

function ItemTile({
  item,
  shared,
  className,
  onZoom,
}: {
  item: WardrobeItem;
  shared?: boolean;
  className?: string;
  onZoom?: (item: WardrobeItem) => void;
}) {
  const hasPhoto = !!item.photo;
  return (
    <button
      type="button"
      onClick={() => hasPhoto && onZoom?.(item)}
      disabled={!hasPhoto}
      aria-label={hasPhoto ? `Zoom ${item.name}` : item.name}
      className={cn(
        "group relative h-full w-full overflow-hidden rounded-xl border border-border/40 bg-secondary transition-transform sm:hover:scale-[1.03]",
        hasPhoto && "cursor-zoom-in",
        className,
      )}
      style={{ backgroundColor: item.color_hex }}
    >
      {hasPhoto && (
        <img
          src={item.photo}
          alt={item.name}
          className="h-full w-full object-contain p-1.5"
          loading="lazy"
          draggable={false}
        />
      )}
      {hasPhoto && (
        <div className="pointer-events-none absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ZoomIn className="h-2.5 w-2.5" />
          Zoom
        </div>
      )}
      {shared && (
        <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground shadow-sm backdrop-blur-sm">
          <Check className="h-2.5 w-2.5" />
          Kept
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-left text-[10px] font-medium text-white">
        {item.name}
      </div>
    </button>
  );
}

function EmptySlot({ zone }: { zone: Zone }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border/40 bg-secondary/20">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
        {ZONE_LABEL[zone]}
      </span>
    </div>
  );
}

export default function OutfitPreviewBoard({ items, highlightSharedIds = [], label }: Props) {
  const sharedSet = new Set(highlightSharedIds);

  // Group by zone (multiple items per zone allowed; e.g. 2 accessories)
  const byZone: Record<Zone, WardrobeItem[]> = {
    outerwear: [],
    top: [],
    bottom: [],
    shoes: [],
    accessory: [],
  };
  for (const it of items) {
    byZone[categoryToZone(it.category as WardrobeCategory)].push(it);
  }

  const renderZone = (zone: Zone) => {
    const zItems = byZone[zone];
    if (zItems.length === 0) return <EmptySlot zone={zone} />;
    if (zItems.length === 1) {
      return <ItemTile item={zItems[0]} shared={sharedSet.has(zItems[0].id)} />;
    }
    return (
      <div className="flex h-full w-full gap-1">
        {zItems.map((it) => (
          <div key={it.id} className="h-full flex-1 min-w-0">
            <ItemTile item={it} shared={sharedSet.has(it.id)} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      <div className="rounded-2xl border border-border/40 bg-card/40 p-3 shadow-neon">
        <div className="grid h-[360px] grid-cols-2 grid-rows-3 gap-2 sm:h-[420px]">
          {/* Row 1: Outerwear + Top */}
          <div className="row-span-1">{renderZone("outerwear")}</div>
          <div className="row-span-1">{renderZone("top")}</div>
          {/* Row 2: Bottom (full width) */}
          <div className="col-span-2 row-span-1">{renderZone("bottom")}</div>
          {/* Row 3: Shoes + Accessory */}
          <div className="row-span-1">{renderZone("shoes")}</div>
          <div className="row-span-1">{renderZone("accessory")}</div>
        </div>
      </div>
    </div>
  );
}
