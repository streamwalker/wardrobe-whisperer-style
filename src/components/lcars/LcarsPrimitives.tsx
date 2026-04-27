import { cn } from "@/lib/utils";

/** Generate a stable LCARS-style serial code from a seed string. */
export function lcarsCode(seed: string | number = "", prefix?: string): string {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const a = (h % 90 + 10).toString();
  const b = ((h >>> 8) % 9000 + 1000).toString();
  return prefix ? `${prefix}-${a}-${b}` : `${a}-${b}`;
}

const COLOR_MAP = {
  orange: "bg-lcars-orange text-black",
  peach: "bg-lcars-peach text-black",
  salmon: "bg-lcars-salmon text-black",
  red: "bg-lcars-red text-white",
  lavender: "bg-lcars-lavender text-black",
  violet: "bg-lcars-violet text-black",
  blue: "bg-lcars-blue text-black",
  cyan: "bg-lcars-cyan text-black",
  yellow: "bg-lcars-yellow text-black",
  bronze: "bg-lcars-bronze text-black",
} as const;

export type LcarsColor = keyof typeof COLOR_MAP;

interface LcarsHeaderProps {
  title: string;
  code?: string;
  color?: LcarsColor;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

/** The signature LCARS panel header: a colored pill + title + serial code. */
export function LcarsHeader({
  title,
  code,
  color = "orange",
  subtitle,
  rightSlot,
  className,
}: LcarsHeaderProps) {
  return (
    <div className={cn("flex items-stretch gap-1 mb-3", className)}>
      <div className={cn("lcars-pill-l px-4 flex items-center", COLOR_MAP[color])}>
        <span className="lcars-label text-xs">LCARS</span>
      </div>
      <div className="flex-1 flex items-center bg-black border-y border-lcars-orange/30 px-4 gap-3">
        <h2 className="font-display text-lg sm:text-xl text-lcars-peach uppercase tracking-widest leading-none">
          {title}
        </h2>
        {subtitle && (
          <span className="lcars-mono text-[10px] text-lcars-cyan uppercase">
            ⌁ {subtitle}
          </span>
        )}
      </div>
      <div className={cn("lcars-pill-r px-4 flex items-center min-w-[90px] justify-end", COLOR_MAP[color])}>
        <span className="lcars-numerals text-xs">{code ?? lcarsCode(title)}</span>
      </div>
      {rightSlot}
    </div>
  );
}

interface LcarsFrameProps {
  children: React.ReactNode;
  topColor?: LcarsColor;
  sideColor?: LcarsColor;
  bottomColor?: LcarsColor;
  className?: string;
}

/** Wraps page content in the iconic LCARS L-shape elbow frame. */
export function LcarsFrame({
  children,
  topColor = "orange",
  sideColor = "lavender",
  bottomColor = "salmon",
  className,
}: LcarsFrameProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Top elbow row */}
      <div className="flex items-stretch gap-1 mb-2">
        <div className={cn("h-6 w-16 rounded-tl-[40px]", COLOR_MAP[topColor])} />
        <div className={cn("h-6 flex-1", COLOR_MAP[topColor])} />
        <div className={cn("h-6 w-8", COLOR_MAP[sideColor])} />
        <div className={cn("h-6 w-12", COLOR_MAP[bottomColor])} />
        <div className={cn("h-6 w-20 rounded-tr-[40px]", COLOR_MAP[topColor])} />
      </div>
      {/* Body */}
      <div>{children}</div>
      {/* Bottom strip */}
      <div className="flex items-stretch gap-1 mt-3">
        <div className={cn("h-3 w-16 rounded-bl-[40px]", COLOR_MAP[bottomColor])} />
        <div className={cn("h-3 flex-1", COLOR_MAP[bottomColor])} />
        <div className={cn("h-3 w-12", COLOR_MAP[sideColor])} />
        <div className={cn("h-3 w-20 rounded-br-[40px]", COLOR_MAP[bottomColor])} />
      </div>
    </div>
  );
}

interface LcarsPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: LcarsColor;
  side?: "l" | "r" | "full";
  code?: string;
}

/** A single LCARS pill button with a half-stadium endcap. */
export function LcarsPill({
  color = "orange",
  side = "full",
  code,
  className,
  children,
  ...props
}: LcarsPillProps) {
  const radius = side === "l" ? "lcars-pill-l" : side === "r" ? "lcars-pill-r" : "lcars-pill";
  return (
    <button
      type="button"
      className={cn(
        radius,
        COLOR_MAP[color],
        "px-4 h-9 inline-flex items-center gap-2 lcars-label text-xs",
        "transition-[filter] duration-150 hover:brightness-110 active:brightness-95",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      {code && <span className="lcars-numerals text-[10px] opacity-80">{code}</span>}
      {children}
    </button>
  );
}

/** Decorative scrolling serial-number ticker. */
export function LcarsTicker({ className }: { className?: string }) {
  const codes = [
    "47-8615", "03-0490", "0-16 V-32", "82-19741", "73-380", "29-1268",
    "EPS 54-2", "MOD II2-70", "84-644", "72-209", "50 IA 17", "10 01 09",
  ];
  return (
    <div className={cn("overflow-hidden whitespace-nowrap text-[10px] text-lcars-cyan/70 lcars-mono", className)}>
      <div className="inline-block animate-lcars-marquee">
        {codes.concat(codes).map((c, i) => (
          <span key={i} className="mx-4">⌁ {c}</span>
        ))}
      </div>
    </div>
  );
}

/** A small LCARS status pill showing a serial code. */
export function LcarsCodeChip({ code, color = "lavender", className }: { code: string; color?: LcarsColor; className?: string }) {
  return (
    <span className={cn("lcars-pill px-2 py-0.5 lcars-numerals text-[10px]", COLOR_MAP[color], className)}>
      {code}
    </span>
  );
}
