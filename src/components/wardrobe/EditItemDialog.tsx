import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WardrobeItem } from "@/lib/wardrobe-data";

const CATEGORIES = ["shoes", "pants", "tops", "outerwear"] as const;
const STYLE_TAGS = ["casual", "neutral", "bold", "luxury", "minimal", "sporty"] as const;

interface Props {
  item: WardrobeItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: {
    name: string;
    category: string;
    primary_color: string;
    color_hex: string;
    style_tags: string[];
  }) => Promise<void>;
}

export default function EditItemDialog({ item, open, onOpenChange, onSave }: Props) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<string>(item.category);
  const [primaryColor, setPrimaryColor] = useState(item.primary_color);
  const [colorHex, setColorHex] = useState(item.color_hex);
  const [styleTags, setStyleTags] = useState<string[]>([...item.style_tags]);
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => {
    setStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !category || !primaryColor.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        primary_color: primaryColor.trim(),
        color_hex: colorHex,
        style_tags: styleTags,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  // Reset form when dialog opens with new item
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setName(item.name);
      setCategory(item.category);
      setPrimaryColor(item.primary_color);
      setColorHex(item.color_hex);
      setStyleTags([...item.style_tags]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          {item.photo && (
            <div className="mx-auto w-24 h-24 rounded-lg overflow-hidden border" style={{ backgroundColor: colorHex }}>
              <img src={item.photo} alt={name} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize text-sm">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="e.g. Navy"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hex</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded border border-input shrink-0"
                />
                <Input
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Style Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition-colors",
                    styleTags.includes(tag)
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !name.trim() || !primaryColor.trim()}
            className="w-full"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
