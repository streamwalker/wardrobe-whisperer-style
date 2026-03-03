import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  categoryValue: string;
  children: ReactNode;
  isOver?: boolean;
}

export default function DroppableCategoryColumn({ categoryValue, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `category-${categoryValue}`,
    data: { category: categoryValue },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full overflow-y-auto scrollbar-none transition-colors rounded-lg",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {children}
    </div>
  );
}
