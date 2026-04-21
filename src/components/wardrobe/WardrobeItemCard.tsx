import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/lib/wardrobe-data";
import { Badge } from "@/components/ui/badge";
import { Star, Check, Trash2, Pencil, RotateCw, Maximize2, ImageIcon, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import EditItemPopover, { type EditItemSaveUpdates } from "./EditItemPopover";
import DeleteItemPopover from "./DeleteItemPopover";

interface Props {
  item: WardrobeItem;
  selected?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  /** Called when the user confirms deletion via the inline popover. May return a promise. */
  onDelete?: () => Promise<void> | void;
  /** Receives form updates and persists them. When provided, the pencil icon opens an inline popover anchored to the card. */
  onSave?: (updates: EditItemSaveUpdates) => Promise<void>;
  /** Called when the user taps the sparkles "Match" action — should select this item and open the AI outfit drawer. */
  onMatch?: () => void;
}

export default function WardrobeItemCard({ item, selected, highlighted, onClick, onDelete, onSave }: Props) {
  const [showBack, setShowBack] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const hasBack = !!item.photo_back;
  const hasAnyPhoto = !!item.photo || hasBack;

  // Reset when the item or its back photo changes
  useEffect(() => {
    setShowBack(false);
  }, [item.id, item.photo_back]);

  const activePhoto = showBack && hasBack ? item.photo_back : item.photo;
  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border bg-card/60 backdrop-blur-sm text-left shadow-sm transition-all duration-300 hover:shadow-glass hover:border-neon-cyan/30 hover:-translate-y-0.5 animate-fade-in",
          selected && "ring-2 ring-neon-cyan border-neon-cyan shadow-neon",
          highlighted && "ring-2 ring-accent border-accent animate-[pulse-highlight_1.5s_ease-in-out]"
        )}
      >
        {/* Selection indicator */}
        {selected && (
          <div className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full neon-gradient-cyan-pink flex items-center justify-center shadow-neon">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )}

        {/* Action buttons for user-added items — always visible on touch, hover on desktop */}
        {(onDelete || onSave) && !selected && (
          <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {onSave && (
              <EditItemPopover
                item={item}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSave={onSave}
              >
                <div
                  className="h-6 w-6 rounded-full bg-card/90 backdrop-blur-sm border flex items-center justify-center shadow cursor-pointer hover:bg-neon-cyan/20 hover:border-neon-cyan/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  role="button"
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil className="h-3 w-3 text-foreground" />
                </div>
              </EditItemPopover>
            )}
            {onDelete && (
              <DeleteItemPopover
                itemName={item.name}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={onDelete}
              >
                <div
                  className="h-6 w-6 rounded-full bg-destructive/90 backdrop-blur-sm flex items-center justify-center shadow cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  role="button"
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="h-3 w-3 text-destructive-foreground" />
                </div>
              </DeleteItemPopover>
            )}
          </div>
        )}

        {/* Photo or color swatch fallback */}
        <div
          className="relative aspect-square w-full overflow-hidden"
          style={{ backgroundColor: item.color_hex }}
        >
          {activePhoto && (
            <img
              src={activePhoto}
              alt={showBack ? `${item.name} (back)` : item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          )}

          {/* Lightbox expand button */}
          {hasAnyPhoto && !selected && (
            <div
              role="button"
              aria-label={`Expand ${item.name} photos`}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              className="absolute top-1.5 right-1.5 z-10 flex items-center justify-center h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm border border-border/60 text-foreground shadow-sm cursor-pointer hover:bg-neon-cyan/10 hover:border-neon-cyan/50 hover:text-neon-cyan transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <Maximize2 className="h-3 w-3" />
            </div>
          )}

          {hasBack && (
            <div
              role="button"
              aria-label={showBack ? "Show front photo" : "Show back photo"}
              onClick={(e) => {
                e.stopPropagation();
                setShowBack((prev) => !prev);
              }}
              className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-neon-cyan/50 px-1.5 py-0.5 text-[9px] font-medium text-neon-cyan shadow-sm cursor-pointer hover:bg-neon-cyan/10 transition-colors"
            >
              <RotateCw className="h-2.5 w-2.5" />
              {showBack ? "Front" : "Back"}
            </div>
          )}
        </div>

        {/* Info — glass panel */}
        <div className="flex flex-col gap-0.5 p-2 glass-card border-t-0 border-x-0 border-b-0 rounded-none">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-card-foreground truncate">{item.name}</span>
            {item.is_featured && <Star className="h-3.5 w-3.5 fill-accent text-accent flex-shrink-0" />}
          </div>
          <span className="text-xs text-muted-foreground">{item.primary_color}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.pattern && item.pattern !== "solid" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize border-neon-cyan/40 text-neon-cyan">
                {item.pattern}
              </Badge>
            )}
            {item.texture && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize border-neon-pink/40 text-neon-pink">
                {item.texture}
              </Badge>
            )}
            {item.style_tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {item.is_new && (
              <Badge className="bg-neon-pink text-white text-[10px] px-1.5 py-0 animate-neon-pulse border-0">
                new
              </Badge>
            )}
          </div>
        </div>
      </button>

      {/* Lightbox: side-by-side front/back */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{item.name} photos</DialogTitle>
          <div className="px-5 pt-5 pb-3">
            <h3 className="font-display text-lg font-semibold text-foreground truncate">{item.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{item.primary_color} · {item.category}</p>
          </div>
          <div className={cn(
            "grid gap-2 px-3 pb-5",
            hasBack ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          )}>
            <div className="flex flex-col gap-1.5">
              <div
                className="relative aspect-square w-full rounded-lg overflow-hidden border"
                style={{ backgroundColor: item.color_hex }}
              >
                {item.photo ? (
                  <img src={item.photo} alt={`${item.name} front`} className="h-full w-full object-contain bg-background/50" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <p className="text-center text-[11px] font-medium text-muted-foreground">Front</p>
            </div>
            {hasBack && (
              <div className="flex flex-col gap-1.5">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border bg-muted/30">
                  <img src={item.photo_back!} alt={`${item.name} back`} className="h-full w-full object-contain bg-background/50" />
                </div>
                <p className="text-center text-[11px] font-medium text-muted-foreground">Back</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
