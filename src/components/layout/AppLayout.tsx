import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, User, Grid3X3, Plus, Layers, Sun, Moon, Crown } from "lucide-react";
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
import { LcarsTicker } from "@/components/lcars/LcarsPrimitives";
import LcarsBoot from "@/components/lcars/LcarsBoot";

const NAV_ITEMS = [
  { path: "/wardrobe", label: "Wardrobe", icon: Grid3X3, color: "bg-lcars-orange", code: "01" },
  { path: "/shop", label: "Shop", icon: ShoppingBag, color: "bg-lcars-lavender", code: "02" },
  { path: "/outfits", label: "Outfits", icon: Heart, color: "bg-lcars-salmon", code: "03" },
  { path: "/profile", label: "Profile", icon: User, color: "bg-lcars-cyan", code: "04" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isPro } = useSubscription();
  const isAlpha = theme === "dark";

  return (
    <div className="flex min-h-screen flex-col bg-mesh">
      <LcarsBoot />

      {/* ===== TOP LCARS BAR ===== */}
      <header className="sticky top-0 z-40 bg-black">
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
              <span className="lcars-numerals text-[10px] hidden sm:inline">NCC-1701-D</span>
            </button>

            {/* Color-segmented mid bar (image 1 vibe) */}
            <div className="hidden md:flex flex-1 items-stretch gap-1">
              <div className="bg-lcars-peach flex-1 flex items-center justify-end px-3">
                <span className="lcars-numerals text-[10px] text-black">47-8615</span>
              </div>
              <div className="bg-lcars-lavender w-16 flex items-center justify-center">
                <span className="lcars-numerals text-[10px] text-black">03-0490</span>
              </div>
              <div className="bg-lcars-salmon w-24 flex items-center justify-center">
                <span className="lcars-label text-[10px] text-black">SECTOR 001</span>
              </div>
              <div className="bg-lcars-cyan w-12" />
              <div className="bg-lcars-yellow w-8" />
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

            {/* Alpha/Beta shift toggle */}
            <button
              onClick={() => setTheme(isAlpha ? "light" : "dark")}
              className={cn(
                "lcars-pill px-3 flex items-center gap-1.5 lcars-label text-[10px] hover:brightness-110 transition-[filter]",
                isAlpha ? "bg-lcars-cyan text-black" : "bg-lcars-violet text-black",
              )}
              aria-label="Toggle shift"
            >
              {isAlpha ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
              <span className="hidden sm:inline">{isAlpha ? "ALPHA" : "BETA"}</span>
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
              <DropdownMenuContent align="end" className="w-56 bg-black border-2 border-lcars-orange rounded-none p-0">
                <div className="bg-lcars-orange text-black lcars-label text-[10px] px-3 py-1.5 flex items-center justify-between">
                  <span>SENSOR INPUT</span>
                  <span className="lcars-numerals">04-0490</span>
                </div>
                <DropdownMenuItem onClick={() => navigate("/wardrobe/add")} className="gap-2 lcars-label text-[11px] text-lcars-peach hover:bg-lcars-orange hover:text-black rounded-none focus:bg-lcars-orange focus:text-black">
                  <Plus className="h-4 w-4" />
                  ADD SINGLE SPECIMEN
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-tour="batch-upload"
                  onClick={() => navigate("/wardrobe/batch")}
                  className="gap-2 lcars-label text-[11px] text-lcars-peach hover:bg-lcars-lavender hover:text-black rounded-none focus:bg-lcars-lavender focus:text-black"
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black pt-1 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="container py-1.5">
          <div className="flex items-stretch gap-1 h-12 sm:h-14">
            <div className="lcars-pill-l bg-lcars-orange w-8 sm:w-12" />
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
                    isActive && "ring-2 ring-inset ring-white brightness-110",
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="lcars-label text-[10px] sm:text-xs">{label}</span>
                    <span className="lcars-numerals text-[8px] sm:text-[9px] opacity-70">{code}</span>
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
