import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

/** LCARS progress meter — 12 segmented orange ticks, like the bars in image 1. */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const v = value || 0;
  const segments = 12;
  const filled = Math.round((v / 100) * segments);
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden bg-black flex gap-[2px] p-0.5 border border-lcars-orange/40", className)}
      {...props}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 transition-colors",
            i < filled ? "bg-lcars-orange" : "bg-lcars-orange/20",
          )}
        />
      ))}
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
