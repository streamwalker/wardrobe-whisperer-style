import { useEffect, useState } from "react";
import { Sparkles, X, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wardrobe-match-tip-dismissed-v1";

interface Props {
  /** Hide the tip when the user has actively engaged (selected items or opened a drawer). */
  shouldHide?: boolean;
}

/**
 * One-time educational tip shown on first visit to the Wardrobe page,
 * teaching users to tap items and use the floating "Match" button to
 * generate AI outfits. Dismissal is persisted in localStorage so the
 * tip never reappears for that browser/user.
 */
export default function WardrobeMatchTip({ shouldHide }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // localStorage unavailable — show once per session anyway.
    }
    // Small delay so the tip animates in after layout settles.
    const t = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!visible || shouldHide) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-neon-cyan/30 glass-card p-3 sm:p-4 shadow-neon",
        "animate-in fade-in slide-in-from-top-2 duration-500",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full neon-gradient-cyan-pink shadow-neon">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-display text-sm sm:text-base font-semibold text-card-foreground">
            Quick tip — generate outfits from your wardrobe
          </p>
          <p className="text-xs sm:text-[13px] leading-relaxed text-muted-foreground">
            <MousePointerClick className="inline h-3.5 w-3.5 -mt-0.5 mr-1 text-neon-cyan" />
            Tap any items to select them, then hit the
            <span className="mx-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-card-foreground align-middle">
              <Sparkles className="h-3 w-3 text-neon-pink" /> Match
            </span>
            button that appears at the bottom to get AI-styled looks.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 -mr-1 -mt-1 text-muted-foreground hover:text-card-foreground"
          onClick={dismiss}
          aria-label="Dismiss tip"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
