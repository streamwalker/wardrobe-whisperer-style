import { LcarsHeader, LcarsFrame, LcarsTickRow, type LcarsColor, lcarsCode } from "./LcarsPrimitives";
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
  return (
    <section className={cn("space-y-2", className)}>
      {tickRows && <LcarsTickRow className="opacity-70" />}
      <LcarsHeader
        title={title}
        subtitle={subtitle}
        code={code ?? lcarsCode(title)}
        color={headerColor}
        rightSlot={
          rightSlot ? (
            <div className="hidden md:flex items-stretch gap-1">{rightSlot}</div>
          ) : undefined
        }
      />
      {mobileActions && (
        <div className="md:hidden flex items-stretch gap-1 overflow-x-auto pb-1 scrollbar-none">
          {mobileActions}
        </div>
      )}
      {rightSlot && (
        <div className="md:hidden flex items-stretch gap-1 overflow-x-auto pb-1 scrollbar-none">
          {rightSlot}
        </div>
      )}
      <LcarsFrame
        topColor={topColor}
        sideColor={sideColor}
        bottomColor={bottomColor}
        variant={variant}
      >
        <div className={variant === "rounded" ? "" : "px-1 sm:px-2"}>{children}</div>
      </LcarsFrame>
      {tickRows && <LcarsTickRow className="opacity-50" dense />}
    </section>
  );
}
