import { useNavigate } from "react-router-dom";
import { type LcarsColor } from "./LcarsPrimitives";
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

  return <div className="min-h-screen bg-background">
    <header className="app-header border-b border-border px-5 py-5"><button onClick={() => navigate("/wardrobe")} className="min-h-11 text-xl font-semibold tracking-tight">drip slayer<span className="text-primary">.</span></button></header>
    <main className={cn("px-4 py-8 pb-16 sm:px-8", className)}><div className={cn("mx-auto", MAX_W[maxWidth])}><LcarsSection title={title} rightSlot={rightSlot}>{children}</LcarsSection></div></main>
  </div>;
}
