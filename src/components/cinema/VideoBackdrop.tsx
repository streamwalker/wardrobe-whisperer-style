import { useEffect, useRef, useState } from 'react';
import { useMotion } from './motion-state';
export type Film = 'street' | 'closet' | 'city';

/** Local, silent video. Only visible films decode; the poster survives autoplay/network failure. */
export default function VideoBackdrop({ film, fixed = false, shade = 'hero' }: { film: Film; fixed?: boolean; shade?: 'hero' | 'workspace' }) {
  const video = useRef<HTMLVideoElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const { paused } = useMotion();
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [foreground, setForeground] = useState(!document.hidden);
  const [mobile] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.25), { threshold: [0, 0.25] });
    if (layer.current) observer.observe(layer.current);
    const visibility = () => setForeground(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (visible && !paused) setLoaded(true);
  }, [visible, paused]);
  useEffect(() => {
    if (!video.current) return;
    if (visible && foreground && !paused && !failed) {
      video.current.play().catch(() => { /* Poster remains visible when iOS blocks autoplay. */ });
    } else video.current.pause();
  }, [visible, foreground, paused, loaded, failed]);
  return <div ref={layer} className={`film-layer film-${film} ${fixed ? 'film-fixed' : ''} film-shade-${shade}`} aria-hidden="true">
    <img className="film-poster" src={`/motion/${film}.jpg`} alt="" />
    {loaded && !failed && <video ref={video} className="film-video" src={`/motion/${film}${mobile ? '-mobile' : ''}.mp4`} poster={`/motion/${film}.jpg`} muted loop playsInline preload="metadata" tabIndex={-1} disablePictureInPicture onError={() => setFailed(true)} onCanPlay={() => {
      if (visible && foreground && !paused) video.current?.play().catch(() => {});
    }} />}
    <div className="film-scrim" />
  </div>;
}
