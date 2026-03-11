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
    <div className="flex min-h-screen flex-col bg-mesh">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b-0 rounded-none">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" />
        <div className="container flex h-14 items-center justify-between">
          <h1
            className="cursor-pointer font-display text-xl font-semibold tracking-tight text-foreground neon-glow"
            onClick={() => navigate("/wardrobe")}
          >
            Drip Slayer
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full neon-gradient-cyan-pink text-white text-lg leading-none shadow-neon transition-transform hover:scale-105 active:scale-95">
                <Plus className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 glass-card border-border/30">
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
        <main className="flex-1 container px-3 sm:px-4 py-3 sm:py-4 pb-20">
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card border-t-0 rounded-none pb-[env(safe-area-inset-bottom,0px)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-pink/40 to-transparent" />
        <div className="container flex h-16 items-center justify-around">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-3 py-1 transition-all active:scale-95",
                  isActive ? "text-neon-cyan" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 h-0.5 w-8 rounded-full neon-gradient-cyan-pink shadow-neon" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
