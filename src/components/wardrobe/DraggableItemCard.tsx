import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import WardrobeItemCard from "./WardrobeItemCard";
import type { WardrobeItem } from "@/lib/wardrobe-data";

interface Props {
  item: WardrobeItem;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function DraggableItemCard({ item, selected, onClick, onDelete, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <WardrobeItemCard
        item={item}
        selected={selected}
        onClick={onClick}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
}
