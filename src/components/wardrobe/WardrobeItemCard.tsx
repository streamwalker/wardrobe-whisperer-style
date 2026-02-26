import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/lib/wardrobe-data";
import { Badge } from "@/components/ui/badge";
import { Star, Check, Trash2, Pencil } from "lucide-react";

interface Props {
  item: WardrobeItem;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function WardrobeItemCard({ item, selected, onClick, onDelete, onEdit }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-all hover:shadow-md animate-fade-in",
        selected && "ring-2 ring-primary border-primary"
      )}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow">
          <Check className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}

      {/* Action buttons for user-added items */}
      {(onDelete || onEdit) && !selected && (
        <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <div
              className="h-6 w-6 rounded-full bg-card/90 border flex items-center justify-center shadow cursor-pointer hover:bg-accent transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              role="button"
              aria-label={`Edit ${item.name}`}
            >
              <Pencil className="h-3 w-3 text-foreground" />
            </div>
          )}
          {onDelete && (
            <div
              className="h-6 w-6 rounded-full bg-destructive/90 flex items-center justify-center shadow cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              role="button"
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="h-3 w-3 text-destructive-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Photo or color swatch fallback */}
      <div
        className="aspect-square w-full overflow-hidden"
        style={{ backgroundColor: item.color_hex }}
      >
        {item.photo && (
          <img
            src={item.photo}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-medium text-card-foreground truncate">{item.name}</span>
          {item.is_featured && <Star className="h-3.5 w-3.5 fill-accent text-accent flex-shrink-0" />}
        </div>
        <span className="text-xs text-muted-foreground">{item.primary_color}</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {item.style_tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {item.is_new && (
            <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0">new</Badge>
          )}
        </div>
      </div>
    </button>
  );
}
