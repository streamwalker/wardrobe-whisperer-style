import { type LcarsColor } from "./LcarsPrimitives";
import { cn } from "@/lib/utils";

interface LcarsSectionProps {
  title: string;
  subtitle?: string;
  code?: string;
  /** Color of the LCARS header pill (left + right endcaps). */
  headerColor?: LcarsColor;
  topColor?: LcarsColor;
  sideColor?: LcarsColor;
  bottomColor?: LcarsColor;
  /** "blocks" = TNG colored elbow strips; "rounded" = Picard double-stroke panel. */
  variant?: "blocks" | "rounded";
  /** Render dotted tick rows above the header / below the frame. Default true. */
  tickRows?: boolean;
  /** Optional pill row rendered to the right of the header (desktop only by default). */
  rightSlot?: React.ReactNode;
  /** Pill row shown below the header on small screens (use for actions that don't fit). */
  mobileActions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Combined LCARS sector wrapper: header bar + L-shape elbow frame around page body.
 * Use as the top-level wrapper for every page so the app feels like one continuous
 * LCARS console.
 */
export function LcarsSection({
  title,
  subtitle,
  code,
  headerColor = "amber",
  topColor = "steel",
  sideColor = "amber",
  bottomColor = "slate",
  variant = "blocks",
  tickRows = true,
  rightSlot,
  mobileActions,
  className,
  children,
}: LcarsSectionProps) {
  const labels: Record<string, string> = {
    "WARDROBE": "Your wardrobe", "MY WARDROBE": "Your wardrobe", "TIER UPGRADE": "Choose your plan",
    "AUTHORIZATION": "Welcome to Drip Slayer", "PROFILE": "Your style profile",
  };
  return <section className={cn("space-y-6", className)}>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Curated by you</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{labels[title] ?? title.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase())}</h1></div>
      {rightSlot && <div className="flex max-w-full flex-wrap items-center gap-2">{rightSlot}</div>}
    </header>
    {mobileActions && <div className="flex flex-wrap gap-2 md:hidden">{mobileActions}</div>}
    <div>{children}</div>
  </section>;
}
