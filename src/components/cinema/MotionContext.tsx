import { useEffect, useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';

import { MotionContext, useMotion } from "./motion-state";

export function MotionProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return reduced || sessionStorage.getItem('dripslayer-motion') === 'paused';
  });
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { if (preference.matches) setPaused(true); };
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const toggle = () => setPaused(value => {
    sessionStorage.setItem('dripslayer-motion', value ? 'playing' : 'paused');
    return !value;
  });
  return <MotionContext.Provider value={{ paused, toggle }}>{children}</MotionContext.Provider>;
}

export function MotionControl() {
  const { paused, toggle } = useMotion();
  return <button className="motion-control" onClick={toggle} aria-label={paused ? 'Play background videos' : 'Pause background videos'} aria-pressed={paused}>
    {paused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
    <span>{paused ? 'Play motion' : 'Pause motion'}</span>
  </button>;
}
