import { Outlet, NavLink, Link } from "react-router-dom";
import { Grid3X3, ShoppingBag, Heart, User, Plus, Moon, Sun, Layers, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navigation = [
  { path: "/wardrobe", label: "Wardrobe", icon: Grid3X3 },
  { path: "/outfits", label: "Outfits", icon: Heart },
  { path: "/shop", label: "Discover", icon: ShoppingBag },
  { path: "/profile", label: "You", icon: User },
];
export default function AppLayout() {
  const { resolvedTheme, setTheme } = useTheme();
  return <div className="app-shell min-h-screen bg-background">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-4">Skip to content</a>
    <header className="app-header sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link to="/wardrobe" className="flex items-center gap-3" aria-label="Drip Slayer home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></span>
          <span><span className="block text-lg font-semibold tracking-tight">drip slayer<span className="text-primary">.</span></span><span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your everyday style companion</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border" aria-label={resolvedTheme === "dark" ? "Use light appearance" : "Use dark appearance"} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <DropdownMenu><DropdownMenuTrigger asChild><button data-tour="add-item" className="flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Add clothing</span><span className="sr-only sm:hidden">Add clothing</span></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem asChild><Link to="/wardrobe/add" className="min-h-11 gap-2"><Plus className="h-4 w-4" />Add one item</Link></DropdownMenuItem><DropdownMenuItem asChild><Link data-tour="batch-upload" to="/wardrobe/batch" className="min-h-11 gap-2"><Layers className="h-4 w-4" />Add multiple items</Link></DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-10 sm:pb-32"><Outlet /></main>
    <nav aria-label="Main navigation" className="app-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-1 px-3 py-2">{navigation.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} data-tour={`nav-${path.slice(1)}`} className={({isActive}) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}><Icon className="h-5 w-5" /><span>{label}</span></NavLink>)}</div>
    </nav>
  </div>;
}
