import { useLocation, useNavigate } from "react-router-dom";
import { CATEGORIES } from "@/lib/wardrobe-data";
import { cn } from "@/lib/utils";
import { lcarsCode, LcarsChipRail, LcarsTickRow } from "@/components/lcars/LcarsPrimitives";

// Cycle of LCARS warm accent colors for category buttons (kept colorful per user request)
const CAT_COLORS = [
  "bg-lcars-orange",
  "bg-lcars-lavender",
  "bg-lcars-salmon",
  "bg-lcars-peach",
  "bg-lcars-violet",
  "bg-lcars-bronze",
  "bg-lcars-blue",
  "bg-lcars-yellow",
  "bg-titan-teal",
];

const RAIL_CODES = [
  "53-929", "NCC-1701", "70-733", "94-826", "92-137",
  "59-134", "46-803", "59-233", "65-953", "53-319", "85-149",
];

export default function CategorySidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const activeCat = params.get("cat") || "all";
  const isWardrobePage = location.pathname === "/wardrobe";

  const handleCategoryClick = (cat: string) => {
    if (cat === "all") {
      navigate("/wardrobe");
    } else {
      navigate(`/wardrobe?cat=${cat}`);
    }
  };

  const items = [{ value: "all", label: "All Items", icon: "◧" }, ...CATEGORIES];

  return (
    <aside
      data-tour="category-sidebar"
      className="hidden md:flex flex-col w-20 lg:w-56 shrink-0 bg-titan-rail sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto border-r border-titan-steel/40"
    >
      {/* Top elbow connecting to header bar */}
      <div className="flex items-stretch gap-1 px-2 pt-2">
        <div className="bg-lcars-orange h-8 flex-1 rounded-tl-[40px]" />
      </div>

      <LcarsTickRow className="mx-2 mt-2 opacity-60" />

      <nav className="flex flex-col gap-1 p-2 pt-2">
        {items.map((cat, idx) => {
          const isActive = isWardrobePage && activeCat === cat.value;
          const colorClass = CAT_COLORS[idx % CAT_COLORS.length];
          const code = lcarsCode(cat.value, String(idx + 1).padStart(2, "0"));
          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryClick(cat.value)}
              className={cn(
                "lcars-pill-l h-9 pl-3 pr-2 text-left transition-[filter] hover:brightness-110 active:brightness-95 flex items-center gap-2",
                colorClass,
                "text-black",
                isActive && "ring-2 ring-inset ring-titan-frost brightness-110",
              )}
            >
              <span className="text-base leading-none shrink-0">{cat.icon}</span>
              <div className="hidden lg:flex flex-col leading-tight overflow-hidden flex-1">
                <span className="lcars-label text-[11px] truncate">{cat.label}</span>
              </div>
              <span className="hidden lg:inline lcars-chip lcars-chip--rail text-[9px] py-0">{code}</span>
            </button>
          );
        })}
      </nav>

      {/* Picard-era data rail */}
      <div className="hidden lg:block px-2 mt-2">
        <LcarsChipRail codes={RAIL_CODES} />
      </div>

      {/* Bottom decorative blocks */}
      <div className="mt-auto p-2 flex flex-col gap-1">
        <LcarsTickRow className="opacity-60" />
        <div className="bg-titan-teal h-2" />
        <div className="bg-titan-amber h-1.5" />
        <div className="bg-lcars-orange h-6 rounded-bl-[40px] flex items-end justify-end px-2 pb-1">
          <span className="lcars-numerals text-[8px] text-black">29-1268</span>
        </div>
      </div>
    </aside>
  );
}
