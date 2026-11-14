import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * LCARS button system. Solid color blocks, rounded-full pills, Antonio uppercase
 * labels with wide tracking. Legacy variants (`neon`, `glass`) are aliased so
 * existing call sites continue to render correctly.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-medium ring-offset-background transition-[filter,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lcars-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:brightness-110 active:brightness-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-lcars-red text-white hover:bg-lcars-red",
        outline: "bg-card text-foreground border border-border hover:bg-lcars-orange/10",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "bg-transparent text-lcars-peach hover:bg-lcars-orange/15",
        link: "bg-transparent text-lcars-cyan underline-offset-4 hover:underline normal-case tracking-normal font-sans",
        // Legacy aliases preserved for backwards compatibility
        neon: "bg-primary text-primary-foreground",
        glass: "bg-card text-foreground border border-border",
      },
      size: {
        default: "min-h-11 px-5 rounded-full",
        sm: "min-h-11 px-3 rounded-full text-[11px]",
        lg: "h-12 px-7 rounded-full text-sm",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
