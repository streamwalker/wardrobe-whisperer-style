import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-full font-display uppercase tracking-widest text-[11px] transition-[filter,background-color] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lcars-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-lcars-orange data-[state=on]:text-black",
  {
    variants: {
      variant: {
        default: "bg-lcars-lavender text-black",
        outline: "bg-black text-lcars-peach border border-lcars-orange/60",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[10px]",
        lg: "h-11 px-5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
