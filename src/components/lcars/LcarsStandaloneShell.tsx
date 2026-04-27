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
  headerColor = "orange",
  topColor = "orange",
  sideColor = "lavender",
  bottomColor = "salmon",
  rightSlot,
  maxWidth = "lg",
  className,
  children,
}: LcarsStandaloneShellProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-mesh">
      {/* ===== TOP LCARS BAR ===== */}
      <header className="sticky top-0 z-40 bg-black">
        <div className="container py-2">
          <div className="flex items-stretch gap-1 h-10">
            <button
              onClick={() => navigate("/wardrobe")}
              className="lcars-pill-l bg-lcars-orange text-black px-5 flex items-center gap-2 hover:brightness-110 transition-[filter]"
            >
              <span className="font-display text-base sm:text-lg uppercase tracking-widest leading-none">
                Drip Slayer
              </span>
              <span className="lcars-numerals text-[10px] hidden sm:inline">NCC-1701-D</span>
            </button>

            <div className="hidden md:flex flex-1 items-stretch gap-1">
              <div className="bg-lcars-peach flex-1 flex items-center justify-end px-3">
                <span className="lcars-numerals text-[10px] text-black">47-8615</span>
              </div>
              <div className="bg-lcars-lavender w-16 flex items-center justify-center">
                <span className="lcars-numerals text-[10px] text-black">03-0490</span>
              </div>
              <div className="bg-lcars-cyan w-12" />
              <div className="bg-lcars-yellow w-8" />
            </div>

            <div className="flex-1 md:hidden bg-lcars-peach" />

            <div className="lcars-pill-r bg-lcars-salmon text-black px-3 flex items-center lcars-label text-[10px]">
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
          >
            {children}
          </LcarsSection>
        </div>
      </main>
    </div>
  );
}
