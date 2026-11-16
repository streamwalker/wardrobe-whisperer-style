import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const destinations = [
  { to: '/', label: 'The experience', note: 'A new way to get dressed' },
  { to: '/wardrobe', label: 'Your wardrobe', note: 'Everything you own, together' },
  { to: '/outfits', label: 'Your outfits', note: 'Find your next favorite combination' },
  { to: '/shop', label: 'Discover', note: 'See how something new fits in' },
  { to: '/profile', label: 'Your profile', note: 'Make it personal' },
  { to: '/pricing', label: 'Drip Slayer Pro', note: 'More possibilities, every day' },
];
export default function CinemaHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <header className={`cinema-header ${scrolled ? 'is-scrolled' : ''}`}>
    <Link className="cinema-wordmark" to="/" aria-label="Drip Slayer home">drip slayer<span>·</span></Link>
    <nav className="cinema-desktop-nav" aria-label="Main navigation">
      <NavLink to="/wardrobe" data-tour="nav-wardrobe">Wardrobe</NavLink>
      <NavLink to="/outfits" data-tour="nav-outfits">Outfits</NavLink>
      <NavLink to="/shop">Discover</NavLink>
    </nav>
    <div className="cinema-header-actions">
      <Link className="cinema-start" to={pathname === '/' ? '/wardrobe' : '/wardrobe/add'} data-tour="add-item">{pathname === '/' ? 'Get dressed' : 'Add clothing'}<ArrowUpRight size={15} /></Link>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className="cinema-menu-trigger" aria-label="Open menu"><span>Menu</span><Menu size={20} /></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="cinema-menu-overlay" />
          <Dialog.Content className="cinema-menu-panel">
            <div className="cinema-menu-top"><Dialog.Title className="cinema-wordmark">drip slayer<span>·</span></Dialog.Title><Dialog.Close aria-label="Close menu" className="cinema-menu-trigger"><span>Close</span><X size={22} /></Dialog.Close></div>
            <Dialog.Description className="sr-only">Explore your wardrobe, outfits, profile, and subscription.</Dialog.Description>
            <nav aria-label="All pages" className="cinema-menu-links">{destinations.map((item, i) => <Dialog.Close key={item.to} asChild><Link to={item.to}><span className="menu-number">0{i + 1}</span><span className="menu-label">{item.label}<small>{item.note}</small></span><ArrowUpRight size={24} /></Link></Dialog.Close>)}</nav>
            <div className="cinema-menu-footer"><Link to="/auth" onClick={() => setOpen(false)}>Sign in</Link><Link to="/wardrobe/add" onClick={() => setOpen(false)}>Add clothing</Link><Link to="/wardrobe/batch" onClick={() => setOpen(false)} data-tour="batch-upload">Batch upload</Link><Link to="/privacy" onClick={() => setOpen(false)}>Privacy</Link><Link to="/terms" onClick={() => setOpen(false)}>Terms</Link></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  </header>;
}
