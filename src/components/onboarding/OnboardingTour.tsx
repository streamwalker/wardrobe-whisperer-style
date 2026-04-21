import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TOUR_STEPS, type TourPlacement } from "./tour-steps";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 8;
const POPOVER_WIDTH = 320;
const POPOVER_GAP = 16;

function computePopoverPosition(
  rect: Rect | null,
  placement: TourPlacement,
  vw: number,
  vh: number,
): { top: number; left: number; arrow: TourPlacement } {
  if (!rect || placement === "center") {
    return { top: vh / 2 - 120, left: vw / 2 - POPOVER_WIDTH / 2, arrow: "center" };
  }

  const popH = 200; // approx
  let top = 0;
  let left = 0;
  let arrow: TourPlacement = placement;

  switch (placement) {
    case "bottom":
      top = rect.top + rect.height + POPOVER_GAP;
      left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
      break;
    case "top":
      top = rect.top - popH - POPOVER_GAP;
      left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - popH / 2;
      left = rect.left - POPOVER_WIDTH - POPOVER_GAP;
      break;
    case "right":
      top = rect.top + rect.height / 2 - popH / 2;
      left = rect.left + rect.width + POPOVER_GAP;
      break;
  }

  // Clamp within viewport, flip if needed
  if (left < 12) left = 12;
  if (left + POPOVER_WIDTH > vw - 12) left = vw - POPOVER_WIDTH - 12;
  if (top < 12) {
    if (placement === "top") {
      top = rect.top + rect.height + POPOVER_GAP;
      arrow = "bottom";
    } else {
      top = 12;
    }
  }
  if (top + popH > vh - 12) {
    if (placement === "bottom") {
      top = rect.top - popH - POPOVER_GAP;
      arrow = "top";
    } else {
      top = vh - popH - 12;
    }
  }

  return { top, left, arrow };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function OnboardingTour({ open, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const isFirst = stepIndex === 0;

  // Reset to step 0 each time tour opens
  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const measureTarget = useCallback(() => {
    if (!open) return;
    setViewport({ w: window.innerWidth, h: window.innerHeight });

    if (!step.targetId) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.targetId}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    // measure after slight delay so scroll settles
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    });
  }, [open, step]);

  useLayoutEffect(() => {
    measureTarget();
  }, [measureTarget]);

  useEffect(() => {
    if (!open) return;
    const handler = () => measureTarget();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    const interval = window.setInterval(handler, 500); // catch async layouts
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
      window.clearInterval(interval);
    };
  }, [open, measureTarget]);

  if (!open || typeof document === "undefined") return null;

  const { w: vw, h: vh } = viewport;
  const placement = step.placement ?? "bottom";
  const pos = computePopoverPosition(rect, placement, vw || window.innerWidth, vh || window.innerHeight);

  // Spotlight rect with padding
  const spotlight = rect
    ? {
        x: rect.left - PADDING,
        y: rect.top - PADDING,
        w: rect.width + PADDING * 2,
        h: rect.height + PADDING * 2,
      }
    : null;

  // Compute curved arrow path from popover edge -> spotlight edge
  const POPOVER_EST_H = 200;
  const arrow = (() => {
    if (!spotlight || placement === "center") return null;

    const popLeft = pos.left;
    const popTop = pos.top;
    const popRight = pos.left + POPOVER_WIDTH;
    const popBottom = pos.top + POPOVER_EST_H;
    const popCX = popLeft + POPOVER_WIDTH / 2;
    const popCY = popTop + POPOVER_EST_H / 2;

    const spotCX = spotlight.x + spotlight.w / 2;
    const spotCY = spotlight.y + spotlight.h / 2;

    let sx = popCX;
    let sy = popCY;
    let ex = spotCX;
    let ey = spotCY;

    // Use the resolved arrow direction (pos.arrow may flip from original placement)
    const dir = pos.arrow === "center" ? placement : pos.arrow;

    switch (dir) {
      case "bottom":
        // popover is below target -> arrow leaves popover top, lands on spotlight bottom
        sx = popCX;
        sy = popTop;
        ex = spotCX;
        ey = spotlight.y + spotlight.h;
        break;
      case "top":
        sx = popCX;
        sy = popBottom;
        ex = spotCX;
        ey = spotlight.y;
        break;
      case "left":
        sx = popRight;
        sy = popCY;
        ex = spotlight.x;
        ey = spotCY;
        break;
      case "right":
        sx = popLeft;
        sy = popCY;
        ex = spotlight.x + spotlight.w;
        ey = spotCY;
        break;
    }

    // Quadratic bezier control point: midpoint offset perpendicular to the line
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;
    const dx = ex - sx;
    const dy = ey - sy;
    const len = Math.max(1, Math.hypot(dx, dy));
    // perpendicular unit vector
    const px = -dy / len;
    const py = dx / len;
    const curve = Math.min(60, len * 0.25);
    const cx = mx + px * curve;
    const cy = my + py * curve;

    const d = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
    // approximate length for dash animation
    const pathLen = Math.round(len + curve);
    return { d, pathLen };
  })();

  const next = () => {
    if (isLast) onClose();
    else setStepIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
  };
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  return createPortal(
    <div className="fixed inset-0 z-[100] animate-fade-in" role="dialog" aria-modal="true" aria-label="Onboarding tour">
      {/* SVG backdrop with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        width="100%"
        height="100%"
        style={{ pointerEvents: "auto" }}
        onClick={(e) => {
          // clicks on backdrop do not close, only Skip button does
          e.stopPropagation();
        }}
      >
        <defs>
          <mask id="onboarding-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.w}
                height={spotlight.h}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="hsl(var(--background) / 0.78)"
          mask="url(#onboarding-spotlight-mask)"
          style={{ backdropFilter: "blur(2px)" }}
        />
        {spotlight && (
          <rect
            x={spotlight.x}
            y={spotlight.y}
            width={spotlight.w}
            height={spotlight.h}
            rx="14"
            ry="14"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="animate-pulse"
            style={{ filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.6))" }}
          />
        )}
      </svg>

      {/* Animated arrow connecting popover to spotlight */}
      {arrow && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="onboarding-arrowhead"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
            </marker>
          </defs>
          <path
            key={`${stepIndex}-${Math.round(pos.top)}-${Math.round(pos.left)}`}
            d={arrow.d}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#onboarding-arrowhead)"
            style={{
              filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.7))",
              strokeDasharray: arrow.pathLen,
              strokeDashoffset: arrow.pathLen,
              animation: `onboarding-arrow-draw 450ms ease-out forwards, onboarding-arrow-pulse 1.6s ease-in-out 450ms infinite`,
            }}
          />
          <style>{`
            @keyframes onboarding-arrow-draw {
              to { stroke-dashoffset: 0; }
            }
            @keyframes onboarding-arrow-pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.65; }
            }
          `}</style>
        </svg>
      )}

      {/* Skip (top-right) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full glass-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Skip tour"
      >
        Skip tour
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Popover */}
      <div
        className={cn(
          "absolute z-10 animate-scale-in",
          "rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl",
          "p-5",
        )}
        style={{
          width: POPOVER_WIDTH,
          top: pos.top,
          left: pos.left,
          boxShadow: "0 20px 60px -10px hsl(var(--primary) / 0.3), 0 0 0 1px hsl(var(--border) / 0.5)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full neon-gradient-cyan-pink shadow-neon">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-cyan">
            Step {stepIndex + 1} of {TOUR_STEPS.length}
          </span>
        </div>

        <h3 className="font-display text-lg font-semibold text-card-foreground mb-1.5">
          {step.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.body}</p>

        {/* Progress dots */}
        <div className="flex gap-1 mb-4">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                i === stepIndex
                  ? "neon-gradient-cyan-pink shadow-neon"
                  : i < stepIndex
                    ? "bg-neon-cyan/60"
                    : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={back}
            disabled={isFirst}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <Button size="sm" variant="neon" onClick={next} className="gap-1.5">
            {isLast ? "Get started" : "Next"}
            {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
