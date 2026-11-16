import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import CinemaHeader from '@/components/cinema/CinemaHeader';
import VideoBackdrop from '@/components/cinema/VideoBackdrop';

export default function Index() {
  return <div className="cinema-home">
    <CinemaHeader />
    <main id="main-content">
      <section className="film-scene scene-opening" aria-labelledby="opening-title">
        <VideoBackdrop film="street" />
        <div className="scene-topline"><span>PERSONAL STYLE. IN MOTION.</span><span>BY STREAMWALKERS</span></div>
        <div className="scene-copy hero-copy">
          <p className="cinema-eyebrow">Your wardrobe. Reimagined.</p>
          <h1 id="opening-title">Less deciding.<br />More <em>living.</em></h1>
          <p className="scene-description">Great style starts with what you already own.</p>
          <Link to="/wardrobe" className="cinema-cta">Find your next look<ArrowUpRight size={18} /></Link>
        </div>
        <a href="#your-wardrobe" className="scene-scroll"><ArrowDown size={16} /><span>Scroll to discover</span></a>
        <span className="scene-counter">01 — 03</span>
      </section>
      <section id="your-wardrobe" className="film-scene scene-wardrobe" aria-labelledby="wardrobe-title">
        <VideoBackdrop film="closet" />
        <div className="scene-copy scene-copy-left">
          <p className="cinema-eyebrow">01 / Make room for possibility</p>
          <h2 id="wardrobe-title">Your closet.<br />A fresh <em>perspective.</em></h2>
          <p className="scene-description">Every piece, in one place. Bring your wardrobe together and see the combinations you’ve been missing.</p>
          <Link to="/wardrobe/add" className="cinema-cta">Add your first piece<ArrowUpRight size={18} /></Link>
          <Link to="/wardrobe" className="cinema-text-link">Explore your wardrobe <ArrowUpRight size={15} /></Link>
        </div>
        <span className="scene-counter">02 — 03</span>
      </section>
      <section className="film-scene scene-outfits" aria-labelledby="outfit-title">
        <VideoBackdrop film="city" />
        <div className="scene-copy scene-copy-left">
          <p className="cinema-eyebrow">02 / Wear it your way</p>
          <h2 id="outfit-title">Same you.<br />New <em>possibilities.</em></h2>
          <p className="scene-description">Find your colors. Save your favorite looks.<br />Step into whatever the day brings.</p>
          <Link to="/outfits" className="cinema-cta">Build a look<ArrowUpRight size={18} /></Link>
        </div>
        <footer className="cinema-footer"><Link to="/" className="cinema-wordmark">drip slayer<span>·</span></Link><div><Link to="/profile">Your profile</Link><Link to="/pricing">Go Pro</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div><span>Style is personal. Keep it that way.</span></footer>
      </section>
    </main>
  </div>;
}
