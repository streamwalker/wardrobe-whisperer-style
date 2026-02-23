import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/lib/wardrobe-data";
import { Badge } from "@/components/ui/badge";
import { Star, Check } from "lucide-react";

interface Props {
  item: WardrobeItem;
  selected?: boolean;
  onClick?: () => void;
}

export default function WardrobeItemCard({ item, selected, onClick }: Props) {
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
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-card-foreground truncate">{item.name}</span>
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
