import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  children: ReactNode;
}

export default function DeleteItemPopover({ itemName, open, onOpenChange, onConfirm, children }: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-64 max-w-[calc(100vw-1.5rem)] glass-card border-destructive/40"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-destructive/15 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Delete this item?</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                "{itemName}" will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs gap-1"
              onClick={handleConfirm}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
              Delete
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
