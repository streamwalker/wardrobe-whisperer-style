import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, User, Grid3X3, Plus, Layers, Sun, Moon, Crown, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CategorySidebar from "./CategorySidebar";
import { LcarsTicker, LcarsTickRow, LcarsCodeChip } from "@/components/lcars/LcarsPrimitives";
import LcarsBoot from "@/components/lcars/LcarsBoot";

const NAV_ITEMS = [
  { path: "/wardrobe", label: "Wardrobe", icon: Grid3X3, color: "bg-lcars-orange", code: "47-8615" },
  { path: "/shop",     label: "Shop",     icon: ShoppingBag, color: "bg-lcars-lavender", code: "03-0490" },
  { path: "/outfits",  label: "Outfits",  icon: Heart, color: "bg-lcars-salmon",   code: "70-863" },
  { path: "/profile",  label: "Profile",  icon: User,  color: "bg-titan-teal",     code: "29-1268" },
];

type Shift = "alpha" | "beta" | "gamma";

function readShift(): Shift {
  if (typeof window === "undefined") return "alpha";
  const v = localStorage.getItem("lcars-shift");
  if (v === "alpha" || v === "beta" || v === "gamma") return v;
  return "alpha";
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { isPro } = useSubscription();

  const [shift, setShift] = useState<Shift>(() => readShift());

  // Sync theme + html class with the chosen shift
  useEffect(() => {
    localStorage.setItem("lcars-shift", shift);
    const html = document.documentElement;
    html.classList.toggle("gamma-shift", shift === "gamma");
    if (shift === "alpha" || shift === "gamma") setTheme("dark");
    else setTheme("light");
  }, [shift, setTheme]);

  // Inject the gamma-shift filter once (kept here so it lives outside index.css edits)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "lcars-gamma-shift-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      html.gamma-shift body { filter: brightness(0.82) hue-rotate(-6deg) saturate(0.9); }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-mesh">
      <LcarsBoot />

      {/* ===== TOP LCARS BAR ===== */}
      <header className="sticky top-0 z-40 bg-black border-b border-titan-steel/30">
        <LcarsTickRow className="opacity-70" />
        <div className="container py-2">
          <div className="flex items-stretch gap-1 h-10">
            {/* Left endcap pill — title */}
            <button
              onClick={() => navigate("/wardrobe")}
              className="lcars-pill-l bg-lcars-orange text-black px-5 flex items-center gap-2 hover:brightness-110 transition-[filter]"
            >
              <span className="font-display text-base sm:text-lg uppercase tracking-widest leading-none">
                Drip Slayer
              </span>
              <span className="lcars-numerals text-[10px] hidden sm:inline">NCC-80102-A</span>
            </button>

            {/* Picard-era slate mid-bar with sparse accents (image USS_Titan_2-2) */}
            <div className="hidden md:flex flex-1 items-stretch gap-1">
              <div className="bg-titan-rail border-y border-titan-steel/40 flex-1 flex items-center justify-end px-3 gap-2">
                <LcarsCodeChip code="47-8615" />
                <LcarsCodeChip code="03-0490" color="rail" />
                <LcarsCodeChip code="MOD II2-70" />
              </div>
              <div className="bg-titan-steel w-12 flex items-center justify-center">
                <span className="lcars-numerals text-[10px] text-titan-frost">648</span>
              </div>
              <div className="bg-titan-amber w-8" />
              <div className="bg-titan-teal  w-8" />
            </div>

            {/* Pro badge */}
            {!isPro && (
              <button
                onClick={() => navigate("/pricing")}
                className="lcars-pill bg-lcars-yellow text-black px-3 flex items-center gap-1.5 lcars-label text-[10px] hover:brightness-110 transition-[filter]"
              >
                <Crown className="h-3 w-3" />
                <span>TIER 02</span>
              </button>
            )}

            {/* Tri-shift selector: ALPHA / BETA / GAMMA (image USS_Titan_2-2 bottom) */}
            <div className="hidden sm:flex items-stretch border border-titan-steel/60 bg-black">
              <ShiftButton
                label="ALPHA"
                active={shift === "alpha"}
                color="bg-titan-amber"
                icon={<Moon className="h-3 w-3" />}
                onClick={() => setShift("alpha")}
              />
              <ShiftButton
                label="BETA"
                active={shift === "beta"}
                color="bg-titan-frost"
                icon={<Sun className="h-3 w-3" />}
                onClick={() => setShift("beta")}
              />
              <ShiftButton
                label="GAMMA"
                active={shift === "gamma"}
                color="bg-titan-teal"
                icon={<Eye className="h-3 w-3" />}
                onClick={() => setShift("gamma")}
              />
            </div>
            {/* Mobile compact shift toggle */}
            <button
              onClick={() => setShift(shift === "alpha" ? "beta" : shift === "beta" ? "gamma" : "alpha")}
              className="sm:hidden lcars-pill px-2 bg-titan-steel text-titan-frost lcars-label text-[10px]"
              aria-label="Cycle shift"
            >
              {shift.toUpperCase()}
            </button>

            {/* + INPUT pill (right endcap) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-tour="add-item"
                  className="lcars-pill-r bg-lcars-red text-white px-4 flex items-center gap-1.5 lcars-label text-[10px] hover:brightness-110 transition-[filter]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>INPUT</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-black border-2 border-titan-steel rounded-none p-0">
                <div className="bg-titan-steel text-titan-frost lcars-label text-[10px] px-3 py-1.5 flex items-center justify-between">
                  <span>SENSOR INPUT</span>
                  <span className="lcars-numerals">04-0490</span>
                </div>
                <DropdownMenuItem onClick={() => navigate("/wardrobe/add")} className="gap-2 lcars-label text-[11px] text-titan-frost hover:bg-titan-amber hover:text-black rounded-none focus:bg-titan-amber focus:text-black">
                  <Plus className="h-4 w-4" />
                  ADD SINGLE SPECIMEN
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-tour="batch-upload"
                  onClick={() => navigate("/wardrobe/batch")}
                  className="gap-2 lcars-label text-[11px] text-titan-frost hover:bg-titan-teal hover:text-black rounded-none focus:bg-titan-teal focus:text-black"
                >
                  <Layers className="h-4 w-4" />
                  BATCH UPLINK
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Sub-bar: serial-number ticker */}
          <div className="mt-1 h-3 flex items-center">
            <LcarsTicker className="flex-1" />
          </div>
        </div>
      </header>

      {/* ===== BODY: sidebar + content ===== */}
      <div className="flex flex-1">
        <CategorySidebar />
        <main className="flex-1 container px-3 sm:px-4 py-3 sm:py-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
          <Outlet />
        </main>
      </div>

      {/* ===== BOTTOM LCARS NAV ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black pt-1 pb-[env(safe-area-inset-bottom,0px)] border-t border-titan-steel/30">
        <LcarsTickRow className="opacity-60" />
        <div className="container py-1.5">
          <div className="flex items-stretch gap-1 h-12 sm:h-14">
            <div className="lcars-pill-l bg-titan-steel w-8 sm:w-12" />
            {NAV_ITEMS.map(({ path, label, icon: Icon, color, code }, idx) => {
              const isActive = location.pathname.startsWith(path);
              const tourId =
                path === "/outfits"
                  ? "nav-outfits"
                  : path === "/profile"
                    ? "nav-profile"
                    : path === "/wardrobe"
                      ? "nav-wardrobe"
                      : undefined;
              const isLast = idx === NAV_ITEMS.length - 1;
              return (
                <button
                  key={path}
                  data-tour={tourId}
                  onClick={() => navigate(path)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-2 transition-[filter] active:brightness-90",
                    color,
                    "text-black",
                    isLast && "lcars-pill-r",
                    isActive && "ring-2 ring-inset ring-titan-frost brightness-110",
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="lcars-label text-[10px] sm:text-xs">{label}</span>
                    <span className="lcars-numerals text-[8px] sm:text-[9px] opacity-75">{code}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

function ShiftButton({
  label,
  icon,
  color,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 flex items-center gap-1 lcars-label text-[10px] transition-colors",
        active ? `${color} text-black` : "bg-transparent text-titan-frost hover:bg-titan-rail",
      )}
      aria-pressed={active}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
