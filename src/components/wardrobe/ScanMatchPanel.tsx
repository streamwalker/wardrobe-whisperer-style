import { useMemo } from "react";
import type { CatalogMatchResult, ScannedItem } from "@/lib/catalog-match";
import ScanMatchRail from "./ScanMatchRail";
import { describeOutfitPalette } from "@/lib/color-theory";
import { LcarsCodeChip, lcarsCode } from "@/components/lcars/LcarsPrimitives";
import { cn } from "@/lib/utils";

interface Props {
  scanned: ScannedItem;
  matches: CatalogMatchResult;
  onItemClick?: (id: string) => void;
  className?: string;
}

export default function ScanMatchPanel({ scanned, matches, onItemClick, className }: Props) {
  const totalHits = matches.shoes.length + matches.pants.length + matches.shirts.length;

  // Use the best single-color match across rails as the headline relationship label.
  const headline = useMemo(() => {
    const allHexes = [
      scanned.color_hex,
      ...matches.shoes.map((m) => m.item.color_hex),
      ...matches.pants.map((m) => m.item.color_hex),
      ...matches.shirts.map((m) => m.item.color_hex),
    ].filter(Boolean);
    return describeOutfitPalette(allHexes);
  }, [scanned.color_hex, matches]);

  const serial = lcarsCode(`${scanned.color_hex}-${scanned.name ?? ""}`, "SCAN");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-titan-steel/60 bg-titan-slate/60 p-3 sm:p-4 space-y-3",
        className,
      )}
    >
      {/* Header strip */}
      <div className="flex items-stretch gap-1">
        <div className="lcars-pill-l bg-lcars-cyan px-3 flex items-center">
          <span className="lcars-label text-[10px] text-black">SCAN</span>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-titan-rail border-y border-titan-steel/50 px-3 min-w-0">
          <span className="font-display text-xs sm:text-sm uppercase tracking-widest text-titan-frost truncate">
            Top Matches in Your Catalog
          </span>
        </div>
        <div className="lcars-pill-r bg-lcars-orange px-3 flex items-center">
          <span className="lcars-numerals text-[10px] text-black">{serial}</span>
        </div>
      </div>

      {/* Sub-strip with scanned swatch + relationship + hit count */}
      <div className="flex items-center gap-2 rounded-md border border-titan-steel/50 bg-titan-rail/50 px-2 py-1.5">
        <span
          className="color-swatch-dot"
          style={{ backgroundColor: scanned.color_hex }}
          aria-hidden
        />
        <span className="lcars-mono text-[10px] uppercase tracking-wider text-titan-frost/90 truncate">
          {scanned.primary_color || "Scanned"} · {scanned.name || "Item"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <LcarsCodeChip code={headline.label} color="teal" />
          <LcarsCodeChip code={`${totalHits} HIT${totalHits === 1 ? "" : "S"}`} color="amber" />
        </div>
      </div>

      {totalHits === 0 ? (
        <p className="rounded-md border border-dashed border-titan-steel/60 bg-titan-rail/40 px-3 py-4 text-center text-[11px] uppercase tracking-wider text-titan-frost/70">
          No catalog matches yet — add more items to your wardrobe to see instant pairings.
        </p>
      ) : (
        <div className="space-y-3">
          <ScanMatchRail
            label="SHOES"
            icon="👟"
            matches={matches.shoes}
            emptyHint="No shoes in catalog"
            onItemClick={onItemClick}
          />
          <ScanMatchRail
            label="PANTS"
            icon="👖"
            matches={matches.pants}
            emptyHint="No pants in catalog"
            onItemClick={onItemClick}
          />
          <ScanMatchRail
            label="SHIRTS"
            icon="👕"
            matches={matches.shirts}
            emptyHint="No shirts in catalog"
            onItemClick={onItemClick}
          />
        </div>
      )}
    </div>
  );
}
