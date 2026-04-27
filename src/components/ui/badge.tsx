import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-display uppercase tracking-widest border transition-[filter] hover:brightness-110",
  {
    variants: {
      variant: {
        default: "border-transparent bg-lcars-orange text-black",
        secondary: "border-transparent bg-lcars-lavender text-black",
        destructive: "border-transparent bg-lcars-red text-white",
        outline: "border-lcars-orange/70 text-lcars-peach bg-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
