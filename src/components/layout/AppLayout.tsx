import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, User, Grid3X3, Plus, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CategorySidebar from "./CategorySidebar";

const NAV_ITEMS = [
  { path: "/wardrobe", label: "Wardrobe", icon: Grid3X3 },
  { path: "/shop", label: "Shop", icon: ShoppingBag },
  { path: "/outfits", label: "Outfits", icon: Heart },
  { path: "/profile", label: "Profile", icon: User },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header — clean, Pinterest-style */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="container flex h-14 items-center justify-between">
          <h1
            className="cursor-pointer font-display text-xl font-bold tracking-tight text-foreground"
            onClick={() => navigate("/wardrobe")}
          >
            Drip Slayer
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-sm">
                <Plus className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => navigate("/wardrobe/add")} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Single Item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/wardrobe/batch")} className="gap-2">
                <Layers className="h-4 w-4" />
                Batch Upload
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1">
        <CategorySidebar />
        <main className="flex-1 container py-4 pb-20">
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation — clean pill style */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/30 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="container flex h-14 items-center justify-around">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all active:scale-95",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
