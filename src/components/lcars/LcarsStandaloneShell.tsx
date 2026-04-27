import { useNavigate } from "react-router-dom";
import { LcarsTicker, LcarsTickRow, LcarsCodeChip, type LcarsColor } from "./LcarsPrimitives";
import { LcarsSection } from "./LcarsSection";
import { cn } from "@/lib/utils";

interface LcarsStandaloneShellProps {
  title: string;
  subtitle?: string;
  code?: string;
  headerColor?: LcarsColor;
  topColor?: LcarsColor;
  sideColor?: LcarsColor;
  bottomColor?: LcarsColor;
  /** Slot for back-link pills shown on the right of the title bar. */
  rightSlot?: React.ReactNode;
  /** Constrain content width (legal pages, auth card, etc.). */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  children: React.ReactNode;
}

const MAX_W: Record<NonNullable<LcarsStandaloneShellProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-none",
};

/**
 * Wraps unauthenticated / standalone routes (Auth, Terms, Privacy, SharedWardrobe,
 * NotFound) in the same LCARS chrome that AppLayout provides — without the
 * authenticated sidebar / bottom nav. Includes a top "Drip Slayer" pill bar +
 * scrolling serial ticker + a colored sector frame around the body.
 */
export default function LcarsStandaloneShell({
  title,
  subtitle,
  code,
  headerColor = "amber",
  topColor = "steel",
  sideColor = "amber",
  bottomColor = "slate",
  rightSlot,
  maxWidth = "lg",
  className,
  children,
  variant = "rounded",
}: LcarsStandaloneShellProps & { variant?: "blocks" | "rounded" }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-mesh">
      {/* ===== TOP LCARS BAR ===== */}
      <header className="sticky top-0 z-40 bg-black border-b border-titan-steel/30">
        <LcarsTickRow className="opacity-70" />
        <div className="container py-2">
          <div className="flex items-stretch gap-1 h-10">
            <button
              onClick={() => navigate("/wardrobe")}
              className="lcars-pill-l bg-lcars-orange text-black px-5 flex items-center gap-2 hover:brightness-110 transition-[filter]"
            >
              <span className="font-display text-base sm:text-lg uppercase tracking-widest leading-none">
                Drip Slayer
              </span>
              <span className="lcars-numerals text-[10px] hidden sm:inline">NCC-80102-A</span>
            </button>

            <div className="hidden md:flex flex-1 items-stretch gap-1">
              <div className="bg-titan-rail border-y border-titan-steel/40 flex-1 flex items-center justify-end px-3 gap-2">
                <LcarsCodeChip code="47-8615" />
                <LcarsCodeChip code="03-0490" color="rail" />
              </div>
              <div className="bg-titan-steel w-12 flex items-center justify-center">
                <span className="lcars-numerals text-[10px] text-titan-frost">648</span>
              </div>
              <div className="bg-titan-amber w-8" />
              <div className="bg-titan-teal w-8" />
            </div>

            <div className="flex-1 md:hidden bg-titan-rail border-y border-titan-steel/40" />

            <div className="lcars-pill-r bg-titan-steel text-titan-frost px-3 flex items-center lcars-label text-[10px]">
              GUEST
            </div>
          </div>

          <div className="mt-1 h-3 flex items-center">
            <LcarsTicker className="flex-1" />
          </div>
        </div>
      </header>

      {/* ===== SECTOR BODY ===== */}
      <main className={cn("flex-1 container px-3 sm:px-4 py-4", className)}>
        <div className={cn("mx-auto", MAX_W[maxWidth])}>
          <LcarsSection
            title={title}
            subtitle={subtitle}
            code={code}
            headerColor={headerColor}
            topColor={topColor}
            sideColor={sideColor}
            bottomColor={bottomColor}
            rightSlot={rightSlot}
            variant={variant}
          >
            {children}
          </LcarsSection>
        </div>
      </main>

      <LcarsTickRow className="opacity-50" dense />
    </div>
  );
}
