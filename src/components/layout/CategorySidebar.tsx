import { useLocation, useNavigate } from "react-router-dom";
import { CATEGORIES } from "@/lib/wardrobe-data";
import { cn } from "@/lib/utils";
import { lcarsCode } from "@/components/lcars/LcarsPrimitives";

// Cycle of LCARS colors for category buttons (image 1/2/3 palette)
const CAT_COLORS = [
  "bg-lcars-orange",
  "bg-lcars-lavender",
  "bg-lcars-salmon",
  "bg-lcars-peach",
  "bg-lcars-violet",
  "bg-lcars-bronze",
  "bg-lcars-blue",
  "bg-lcars-yellow",
  "bg-lcars-cyan",
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
      className="hidden md:flex flex-col w-20 lg:w-52 shrink-0 bg-black sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto"
    >
      {/* Top elbow connecting to header bar */}
      <div className="flex items-stretch gap-1 px-2 pt-2">
        <div className="bg-lcars-orange h-8 flex-1 rounded-tl-[40px]" />
      </div>

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
                "lcars-pill-l h-10 px-3 text-left transition-[filter] hover:brightness-110 active:brightness-95 flex items-center gap-2",
                colorClass,
                "text-black",
                isActive && "ring-2 ring-inset ring-white brightness-110",
              )}
            >
              <span className="text-base leading-none shrink-0">{cat.icon}</span>
              <div className="hidden lg:flex flex-col leading-tight overflow-hidden">
                <span className="lcars-label text-[11px] truncate">{cat.label}</span>
                <span className="lcars-numerals text-[8px] opacity-70 truncate">{code}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom decorative blocks */}
      <div className="mt-auto p-2 flex flex-col gap-1">
        <div className="bg-lcars-cyan h-3" />
        <div className="bg-lcars-violet h-2" />
        <div className="bg-lcars-orange h-6 rounded-bl-[40px] flex items-end justify-end px-2 pb-1">
          <span className="lcars-numerals text-[8px] text-black">29-1268</span>
        </div>
      </div>
    </aside>
  );
}
