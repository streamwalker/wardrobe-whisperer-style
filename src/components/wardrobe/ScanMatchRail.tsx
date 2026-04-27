import type { ScoredMatch } from "@/lib/catalog-match";
import { LcarsCodeChip } from "@/components/lcars/LcarsPrimitives";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  icon: string;
  matches: ScoredMatch[];
  emptyHint: string;
  onItemClick?: (id: string) => void;
}

export default function ScanMatchRail({ label, icon, matches, emptyHint, onItemClick }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="lcars-chip lcars-chip--amber text-[9px]">{label}</span>
          <span className="text-base leading-none" aria-hidden>
            {icon}
          </span>
        </div>
        <span className="lcars-numerals text-[9px] text-titan-frost/70">
          {matches.length.toString().padStart(2, "0")} HITS
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-titan-steel/60 bg-titan-rail/40 px-3 text-center text-[10px] uppercase tracking-wider text-titan-frost/60">
          {emptyHint}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {matches.map((m) => {
            const it = m.item;
            const interactive = !!onItemClick;
            return (
              <button
                key={it.id}
                type="button"
                disabled={!interactive}
                onClick={() => interactive && onItemClick?.(it.id)}
                className={cn(
                  "group relative flex w-full flex-col overflow-hidden rounded-md border border-titan-steel/60 bg-titan-rail/60 text-left",
                  "scan-match-card",
                  interactive && "transition-transform sm:hover:scale-[1.02]",
                )}
                aria-label={`${it.name} — ${m.score}% match`}
              >
                <div
                  className="relative h-20 w-full sm:h-24"
                  style={{ backgroundColor: it.color_hex }}
                >
                  {it.photo ? (
                    <img
                      src={it.photo}
                      alt={it.name}
                      className="h-full w-full object-contain p-1"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-wider text-titan-frost/60">
                      No photo
                    </div>
                  )}
                  <span className="absolute right-1 top-1">
                    <LcarsCodeChip code={`${m.score}%`} color="amber" />
                  </span>
                </div>
                <div className="px-1.5 py-1">
                  <p className="truncate text-[10px] font-medium text-titan-frost lcars-mono uppercase tracking-wider">
                    {it.name}
                  </p>
                  <p className="truncate text-[9px] text-titan-teal lcars-mono">
                    ⌁ {m.relationshipLabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
