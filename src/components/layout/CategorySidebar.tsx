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
    <aside className="hidden md:flex flex-col w-14 lg:w-44 shrink-0 border-r bg-sidebar sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto transition-all">
      <nav className="flex flex-col gap-0.5 p-2 pt-3">
        {/* All */}
        <button
          onClick={() => handleCategoryClick("all")}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
            isWardrobePage && activeCat === "all"
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="hidden lg:inline truncate">All Items</span>
        </button>

        <div className="my-1 h-px bg-sidebar-border" />

        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
              isWardrobePage && activeCat === cat.value
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <span className="text-base leading-none shrink-0">{cat.icon}</span>
            <span className="hidden lg:inline truncate">{cat.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
