import * as React from "react";

import { cn } from "@/lib/utils";

/** LCARS data-entry field: black, orange hairline, peach text, cyan focus. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-12 w-full bg-card text-foreground px-3 py-2 text-base font-sans border border-input",
          "placeholder:text-muted-foreground",
          "file:border-0 file:bg-lcars-orange file:text-black file:px-3 file:py-1 file:rounded-full file:text-xs file:uppercase file:tracking-widest file:font-display",
          "focus-visible:outline-none focus-visible:border-lcars-cyan focus-visible:ring-1 focus-visible:ring-lcars-cyan",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "rounded-xl",
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
