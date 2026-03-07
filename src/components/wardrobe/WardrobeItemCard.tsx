import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/lib/wardrobe-data";
import { Badge } from "@/components/ui/badge";
import { Star, Check, Trash2, Pencil } from "lucide-react";

interface Props {
  item: WardrobeItem;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function WardrobeItemCard({ item, selected, highlighted, onClick, onDelete, onEdit }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-card text-left transition-all duration-300 break-inside-avoid mb-4",
        "hover:shadow-lg hover:-translate-y-0.5",
        selected && "ring-2 ring-primary shadow-neon",
        highlighted && "ring-2 ring-accent animate-[pulse-highlight_1.5s_ease-in-out]",
        !selected && !highlighted && "shadow-sm"
      )}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-md">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      {/* Action buttons */}
      {(onDelete || onEdit) && !selected && (
        <div className="absolute top-3 left-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onEdit && (
            <div
              className="h-7 w-7 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-sm cursor-pointer hover:bg-accent/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              role="button"
              aria-label={`Edit ${item.name}`}
            >
              <Pencil className="h-3.5 w-3.5 text-foreground" />
            </div>
          )}
          {onDelete && (
            <div
              className="h-7 w-7 rounded-full bg-destructive/90 backdrop-blur-sm flex items-center justify-center shadow-sm cursor-pointer hover:bg-destructive transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              role="button"
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Photo — natural aspect ratio for masonry feel */}
      <div
        className="w-full overflow-hidden"
        style={{ backgroundColor: item.color_hex }}
      >
        {item.photo ? (
          <img
            src={item.photo}
            alt={item.name}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="aspect-[3/4] w-full" />
        )}
      </div>

      {/* Info overlay — clean, minimal */}
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-medium text-card-foreground leading-snug line-clamp-2">{item.name}</span>
          {item.is_featured && <Star className="h-3.5 w-3.5 fill-accent text-accent flex-shrink-0" />}
        </div>
        <span className="text-xs text-muted-foreground">{item.primary_color}</span>
        <div className="flex flex-wrap gap-1 mt-0.5">
          {item.style_tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full font-normal">
              {tag}
            </Badge>
          ))}
          {item.is_new && (
            <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0 rounded-full border-0 font-medium">
              new
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
