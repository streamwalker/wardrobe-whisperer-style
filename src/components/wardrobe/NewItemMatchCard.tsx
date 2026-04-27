import { ArrowRight, Sparkles } from "lucide-react";
import { type WardrobeItem } from "@/lib/wardrobe-data";
import { describeOutfitPalette } from "@/lib/color-theory";
import { LcarsCodeChip, lcarsCode } from "@/components/lcars/LcarsPrimitives";
import { cn } from "@/lib/utils";

interface Props {
  newItem: WardrobeItem;
  matchingItems: WardrobeItem[];
  outfitName: string;
  /** AI-generated explanation from match-outfit. */
  aiExplanation?: string;
  className?: string;
}

const ZONE_ORDER = ["outerwear", "tops", "suits", "pants", "shoes", "dress-shoes", "accessories"] as const;

function sortByZone(items: WardrobeItem[]) {
  return [...items].sort((a, b) => {
    const ai = ZONE_ORDER.indexOf(a.category as (typeof ZONE_ORDER)[number]);
    const bi = ZONE_ORDER.indexOf(b.category as (typeof ZONE_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function PieceTile({
  item,
  isNew,
  size = "md",
}: {
  item: WardrobeItem;
  isNew?: boolean;
  size?: "lg" | "md" | "sm";
}) {
  const heightClass = size === "lg" ? "h-32 sm:h-40" : size === "md" ? "h-20 sm:h-24" : "h-16";
  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-md border bg-titan-rail/60",
        isNew ? "border-titan-teal new-intake-glow" : "border-titan-steel/60",
      )}
    >
      <div
        className={cn("relative w-full", heightClass)}
        style={{ backgroundColor: item.color_hex }}
      >
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.name}
            className="h-full w-full object-contain p-1"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-wider text-titan-frost/60">
            No photo
          </div>
        )}
        {isNew && (
          <span className="absolute left-1 top-1 lcars-chip lcars-chip--teal text-[8px] py-0.5 px-1.5">
            NEW INTAKE
          </span>
        )}
      </div>
      <div className="px-1.5 py-1">
        <p className="truncate text-[10px] font-medium text-titan-frost lcars-mono uppercase tracking-wider">
          {item.name}
        </p>
      </div>
    </div>
  );
}

export default function NewItemMatchCard({
  newItem,
  matchingItems,
  outfitName,
  aiExplanation,
  className,
}: Props) {
  const otherItems = sortByZone(matchingItems.filter((i) => i.id !== newItem.id));
  const allHexes = [newItem.color_hex, ...otherItems.map((i) => i.color_hex)].filter(Boolean);
  const palette = describeOutfitPalette(allHexes);

  // Lightweight pseudo-match score derived from outfit composition (deterministic).
  const score = Math.min(99, 70 + otherItems.length * 6 + (palette.relationship === "complementary" || palette.relationship === "triadic" ? 8 : 4));
  const serial = lcarsCode(`${newItem.id}-${outfitName}`, "MX");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-titan-steel/60 bg-titan-slate/60 p-3 sm:p-4",
        className,
      )}
    >
      {/* Top header strip */}
      <div className="mb-3 flex items-stretch gap-1">
        <div className="lcars-pill-l bg-lcars-lavender px-3 flex items-center">
          <span className="lcars-label text-[10px] text-black">SPOTLIGHT</span>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-titan-rail border-y border-titan-steel/50 px-3">
          <Sparkles className="h-3 w-3 text-titan-teal" />
          <span className="font-display text-xs sm:text-sm uppercase tracking-widest text-titan-frost truncate">
            {outfitName}
          </span>
        </div>
        <div className="lcars-pill-r bg-lcars-orange px-3 flex items-center">
          <span className="lcars-numerals text-[10px] text-black">{serial}</span>
        </div>
      </div>

      {/* 3-column body: NEW · connector · MATCHING */}
      <div className="grid grid-cols-[1fr_auto_2fr] items-stretch gap-2 sm:gap-3">
        {/* JUST ADDED */}
        <div className="flex flex-col gap-1.5">
          <span className="lcars-chip lcars-chip--teal text-[9px] self-start">JUST ADDED</span>
          <PieceTile item={newItem} isNew size="lg" />
          <div className="flex items-center gap-1.5 text-[10px] text-titan-frost/80 lcars-mono uppercase">
            <span
              className="color-swatch-dot"
              style={{ backgroundColor: newItem.color_hex }}
              aria-hidden
            />
            <span className="truncate">{newItem.primary_color}</span>
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center justify-center gap-1.5 px-1">
          <LcarsCodeChip code={`MATCH ${score}`} color="amber" />
          <ArrowRight className="h-5 w-5 text-titan-teal" />
          <span className="lcars-chip lcars-chip--rail text-[8px] py-0.5 px-1.5 text-center">
            {palette.label}
          </span>
        </div>

        {/* MATCHING PIECES */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="lcars-chip lcars-chip--amber text-[9px]">MATCHING PIECES</span>
            <span className="lcars-numerals text-[9px] text-titan-frost/70">
              {otherItems.length.toString().padStart(2, "0")} UNITS
            </span>
          </div>
          {otherItems.length === 0 ? (
            <div className="flex h-32 sm:h-40 items-center justify-center rounded-md border border-dashed border-titan-steel/60 bg-titan-rail/40 px-2 text-center text-[10px] uppercase tracking-wider text-titan-frost/60">
              Standalone piece — no companions in this look
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-1.5",
                otherItems.length === 1 ? "grid-cols-1" :
                otherItems.length === 2 ? "grid-cols-2" :
                "grid-cols-3",
              )}
            >
              {otherItems.slice(0, 6).map((it) => (
                <PieceTile key={it.id} item={it} size="md" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COLOR THEORY strip */}
      <div className="mt-3 rounded-md border border-titan-steel/50 bg-titan-rail/50 p-2.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="lcars-chip lcars-chip--amber text-[9px]">COLOR THEORY</span>
            <span className="lcars-chip lcars-chip--teal text-[9px]">{palette.label}</span>
          </div>
          {/* Mini palette row */}
          <div className="flex items-center gap-1">
            {palette.dominantHexes.slice(0, 6).map((hex, i) => (
              <span
                key={`${hex}-${i}`}
                className="color-swatch-dot"
                style={{ backgroundColor: hex }}
                aria-hidden
              />
            ))}
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-titan-frost/90">
          {palette.rationale}
        </p>
        {aiExplanation && (
          <div className="mt-1.5 flex items-start gap-1.5">
            <span className="lcars-chip lcars-chip--rail text-[8px] mt-0.5 shrink-0">AI</span>
            <p className="text-[11px] leading-relaxed text-titan-frost/75 italic">
              {aiExplanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
