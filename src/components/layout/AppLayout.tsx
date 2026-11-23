import { Outlet, Link, useLocation } from 'react-router-dom';
import CinemaHeader from '@/components/cinema/CinemaHeader';
import VideoBackdrop, { type Film } from '@/components/cinema/VideoBackdrop';

export default function AppLayout() {
  const { pathname } = useLocation();
  const film: Film = pathname.startsWith('/wardrobe') ? 'closet' : pathname === '/outfits' ? 'city' : 'street';
  return <div className="cinema-workspace cinema-app-layout">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-4">Skip to content</a>
    <VideoBackdrop key={film} film={film} fixed shade="workspace" />
    <CinemaHeader />
    <main id="main-content" className="cinema-workspace-content"><Outlet /></main>
    <nav className="cinema-mobile-nav" aria-label="Quick navigation"><Link to="/wardrobe" aria-current={pathname.startsWith('/wardrobe') ? 'page' : undefined}>Wardrobe</Link><Link to="/outfits" aria-current={pathname === '/outfits' ? 'page' : undefined}>Outfits</Link><Link to="/profile" aria-current={pathname === '/profile' ? 'page' : undefined} data-tour="nav-profile">You</Link></nav>
  </div>;
}
