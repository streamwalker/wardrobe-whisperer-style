import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full bg-black text-lcars-peach border border-lcars-orange/60 px-3 py-2 text-sm font-sans rounded-none",
        "placeholder:text-lcars-peach/40 placeholder:uppercase placeholder:tracking-widest placeholder:text-xs",
        "focus-visible:outline-none focus-visible:border-lcars-cyan focus-visible:ring-1 focus-visible:ring-lcars-cyan",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
