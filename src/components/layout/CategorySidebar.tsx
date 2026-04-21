import { useLocation, useNavigate } from "react-router-dom";
import { CATEGORIES, type WardrobeCategory } from "@/lib/wardrobe-data";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

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

  return (
    <aside
      data-tour="category-sidebar"
      className="hidden md:flex flex-col w-14 lg:w-44 shrink-0 glass-panel border-r-0 rounded-none sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto transition-all"
    >
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-neon-cyan/20 via-neon-pink/10 to-transparent" />
      <nav className="flex flex-col gap-0.5 p-2 pt-3">
        {/* All */}
        <button
          onClick={() => handleCategoryClick("all")}
          className={cn(
            "relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition-all",
            isWardrobePage && activeCat === "all"
              ? "glass-card text-neon-cyan shadow-neon/20"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          {isWardrobePage && activeCat === "all" && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-neon-cyan shadow-neon" />
          )}
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="hidden lg:inline truncate">All Items</span>
        </button>

        <div className="my-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
            className={cn(
              "relative flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition-all",
              isWardrobePage && activeCat === cat.value
                ? "glass-card text-neon-cyan shadow-neon/20"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            {isWardrobePage && activeCat === cat.value && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-neon-cyan shadow-neon" />
            )}
            <span className="text-base leading-none shrink-0">{cat.icon}</span>
            <span className="hidden lg:inline truncate">{cat.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
