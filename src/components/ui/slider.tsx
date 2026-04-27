import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/** LCARS slider — flat orange track, peach fill, tall lavender rectangular thumb. */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden bg-lcars-orange/30">
      <SliderPrimitive.Range className="absolute h-full bg-lcars-peach" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-6 w-3 bg-lcars-lavender transition-[filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lcars-cyan disabled:pointer-events-none disabled:opacity-50 hover:brightness-110" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
