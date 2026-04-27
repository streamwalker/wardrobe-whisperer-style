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
  // Picard-era cool tones
  slate: "bg-titan-slate text-titan-frost",
  steel: "bg-titan-steel text-titan-frost",
  rail: "bg-titan-rail text-titan-frost",
  teal: "bg-titan-teal text-black",
  amber: "bg-titan-amber text-black",
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
      <div className="flex-1 flex items-center bg-titan-rail border-y border-titan-steel/50 px-4 gap-3">
        <h2 className="font-display text-lg sm:text-xl text-titan-frost uppercase tracking-widest leading-none">
          {title}
        </h2>
        {subtitle && (
          <span className="lcars-mono text-[10px] text-titan-teal uppercase">
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
  /** "blocks" = TNG-era colored elbow strips; "rounded" = Picard-era thin double-stroke panel. */
  variant?: "blocks" | "rounded";
  className?: string;
}

/** Wraps page content in the iconic LCARS L-shape elbow frame. */
export function LcarsFrame({
  children,
  topColor = "steel",
  sideColor = "amber",
  bottomColor = "slate",
  variant = "blocks",
  className,
}: LcarsFrameProps) {
  if (variant === "rounded") {
    return (
      <div className={cn("lcars-frame-rounded p-4 sm:p-5", className)}>
        {children}
      </div>
    );
  }
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
    <div className={cn("overflow-hidden whitespace-nowrap text-[10px] text-titan-teal/70 lcars-mono", className)}>
      <div className="inline-block animate-lcars-marquee">
        {codes.concat(codes).map((c, i) => (
          <span key={i} className="mx-4">⌁ {c}</span>
        ))}
      </div>
    </div>
  );
}

/** A small LCARS status pill showing a serial code. Defaults to slate (Picard-era). */
export function LcarsCodeChip({
  code,
  color = "slate",
  variant = "slate",
  className,
}: {
  code: string;
  color?: LcarsColor;
  /** "slate" = thin Picard chip; "block" = colored TNG-era pill. */
  variant?: "slate" | "block";
  className?: string;
}) {
  if (variant === "block") {
    return (
      <span className={cn("lcars-pill px-2 py-0.5 lcars-numerals text-[10px]", COLOR_MAP[color], className)}>
        {code}
      </span>
    );
  }
  // Picard slate chip; map a few colors onto chip variants
  const chipVariant =
    color === "amber" || color === "orange" || color === "yellow" ? "lcars-chip--amber"
    : color === "teal" || color === "cyan" || color === "blue" ? "lcars-chip--teal"
    : color === "red" ? "lcars-chip--alert"
    : color === "rail" ? "lcars-chip--rail"
    : color === "slate" ? "lcars-chip--slate"
    : "";
  return <span className={cn("lcars-chip", chipVariant, className)}>{code}</span>;
}

/** Dotted tick row (Picard-era panel divider). */
export function LcarsTickRow({
  dense = false,
  className,
}: {
  dense?: boolean;
  className?: string;
}) {
  return <div className={cn("lcars-tick-row", dense && "lcars-tick-row--dense", className)} aria-hidden />;
}

/** A vertical column of slate code chips — fills empty rail space the Picard way. */
export function LcarsChipRail({
  codes,
  accentEvery = 4,
  className,
}: {
  codes: string[];
  accentEvery?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)} aria-hidden>
      {codes.map((c, i) => {
        const variant =
          i % accentEvery === 0 ? "lcars-chip--amber"
          : i % (accentEvery * 2) === 1 ? "lcars-chip--teal"
          : "lcars-chip--slate";
        return (
          <span key={`${c}-${i}`} className={cn("lcars-chip text-[10px] py-0.5", variant)}>
            {c}
          </span>
        );
      })}
    </div>
  );
}

/** Vertical 0–100 level gauge with tick marks and a colored fill wedge. */
export function LcarsLevelGauge({
  value,
  max = 100,
  label,
  tone = "amber",
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  tone?: "amber" | "alert" | "teal";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fillColor =
    tone === "alert" ? "hsl(var(--lcars-red))"
    : tone === "teal" ? "hsl(var(--titan-teal))"
    : "hsl(var(--titan-amber))";
  return (
    <div className={cn("inline-flex flex-col items-stretch gap-1", className)} aria-label={label}>
      {label && <span className="lcars-chip lcars-chip--rail text-[9px] text-center">{label}</span>}
      <div className="flex items-stretch gap-1 h-40">
        {/* Tick scale */}
        <div className="flex flex-col justify-between text-[8px] lcars-numerals text-titan-frost/80 pr-0.5 select-none">
          {[100, 80, 60, 40, 20, 0].map((n) => (
            <span key={n}>{n.toString().padStart(2, "0")}</span>
          ))}
        </div>
        {/* Gauge bar */}
        <div className="relative w-4 bg-titan-rail border border-titan-steel/60 overflow-hidden">
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{ height: `${pct}%`, background: fillColor }}
          />
          {/* Slim ticks */}
          <div className="absolute inset-0 pointer-events-none">
            {[20, 40, 60, 80].map((n) => (
              <div
                key={n}
                className="absolute left-0 right-0 h-px bg-titan-frost/25"
                style={{ bottom: `${n}%` }}
              />
            ))}
          </div>
          {/* Indicator wedge */}
          <div
            className="absolute -left-1 w-2 h-1.5"
            style={{ bottom: `calc(${pct}% - 3px)`, background: fillColor }}
          />
        </div>
      </div>
      <span className="lcars-numerals text-[10px] text-titan-frost text-center">
        {Math.round(pct)}
      </span>
    </div>
  );
}

/** Full-width "ALERT: CONDITION RED" banner styled after image 4. */
export function LcarsAlertBanner({
  title = "ALERT: CONDITION RED",
  subtitle,
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-stretch gap-1 mb-3", className)}>
      <div className="bg-lcars-red w-3" />
      <div className="bg-lcars-red flex-1 lcars-pill-r px-4 py-2 flex items-center justify-between">
        <span className="font-display text-base sm:text-lg text-white uppercase tracking-widest">
          {title}
        </span>
        {subtitle && (
          <span className="lcars-mono text-[10px] text-white/85 uppercase">{subtitle}</span>
        )}
        <span className="bg-white/90 w-2 h-6 ml-3" />
      </div>
    </div>
  );
}
