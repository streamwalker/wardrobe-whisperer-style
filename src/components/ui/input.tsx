import * as React from "react";

import { cn } from "@/lib/utils";

/** LCARS data-entry field: black, orange hairline, peach text, cyan focus. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full bg-black text-lcars-peach px-3 py-2 text-sm font-sans border border-lcars-orange/60",
          "placeholder:text-lcars-peach/40 placeholder:uppercase placeholder:tracking-widest placeholder:text-xs",
          "file:border-0 file:bg-lcars-orange file:text-black file:px-3 file:py-1 file:rounded-full file:text-xs file:uppercase file:tracking-widest file:font-display",
          "focus-visible:outline-none focus-visible:border-lcars-cyan focus-visible:ring-1 focus-visible:ring-lcars-cyan",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "rounded-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
