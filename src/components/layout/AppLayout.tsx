import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Shirt, ShoppingBag, Heart, User, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <h1
            className="cursor-pointer font-display text-xl font-semibold tracking-tight text-foreground"
            onClick={() => navigate("/wardrobe")}
          >
            StyleMatch
          </h1>
          <button
            onClick={() => navigate("/wardrobe/add")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg leading-none"
          >
            +
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-4 pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
        <div className="container flex h-16 items-center justify-around">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
