import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  className?: string;
  /** Background color shown behind the image (typically the item's color_hex). */
  backgroundColor?: string;
  /** Min zoom level. Default 1. */
  minScale?: number;
  /** Max zoom level. Default 5. */
  maxScale?: number;
}

/**
 * Lightweight, dependency-free pinch / wheel / drag zoom container.
 * - Mouse wheel zooms toward the cursor.
 * - Two-finger pinch zooms toward the gesture midpoint.
 * - Drag pans when zoomed in.
 * - Double-tap / double-click toggles 1x ↔ 2.5x.
 */
export default function ZoomableImage({
  src,
  alt,
  className,
  backgroundColor,
  minScale = 1,
  maxScale = 5,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // Pointer tracking for pan & pinch
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchMidRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const clampScale = (s: number) => Math.max(minScale, Math.min(maxScale, s));

  const clampTranslate = (nextScale: number, x: number, y: number) => {
    const el = containerRef.current;
    if (!el) return { x, y };
    const w = el.clientWidth;
    const h = el.clientHeight;
    // Allow panning up to half the extra zoomed area in either direction.
    const maxX = ((nextScale - 1) * w) / 2;
    const maxY = ((nextScale - 1) * h) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const zoomAt = (clientX: number, clientY: number, nextScale: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Position of cursor relative to container center
    const cx = clientX - rect.left - rect.width / 2;
    const cy = clientY - rect.top - rect.height / 2;
    const ratio = nextScale / scale;
    // Adjust translation so the point under the cursor stays put.
    const newTx = cx - (cx - tx) * ratio;
    const newTy = cy - (cy - ty) * ratio;
    const clamped = clampTranslate(nextScale, newTx, newTy);
    setScale(nextScale);
    setTx(clamped.x);
    setTy(clamped.y);
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const next = clampScale(scale * (1 + delta));
    if (next === scale) return;
    zoomAt(e.clientX, e.clientY, next);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      // Detect double-tap / double-click
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        const next = scale > 1.1 ? 1 : 2.5;
        if (next === 1) {
          setScale(1);
          setTx(0);
          setTy(0);
        } else {
          zoomAt(e.clientX, e.clientY, next);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
      panStartRef.current = { x: e.clientX, y: e.clientY, tx, ty };
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      lastPinchDistRef.current = Math.hypot(dx, dy);
      lastPinchMidRef.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      panStartRef.current = null;
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      const mid = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      if (lastPinchDistRef.current != null) {
        const ratio = dist / lastPinchDistRef.current;
        const next = clampScale(scale * ratio);
        zoomAt(mid.x, mid.y, next);
      }
      lastPinchDistRef.current = dist;
      lastPinchMidRef.current = mid;
    } else if (pointersRef.current.size === 1 && panStartRef.current && scale > 1) {
      const start = panStartRef.current;
      const nx = start.tx + (e.clientX - start.x);
      const ny = start.ty + (e.clientY - start.y);
      const clamped = clampTranslate(scale, nx, ny);
      setTx(clamped.x);
      setTy(clamped.y);
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
      lastPinchMidRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      panStartRef.current = null;
    }
  };

  // Reset when src changes
  useEffect(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full select-none overflow-hidden touch-none",
        scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
        className,
      )}
      style={{ backgroundColor }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-contain p-1.5 will-change-transform lcars-image-tint"
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: pointersRef.current.size === 0 && lastPinchDistRef.current == null ? "transform 120ms ease-out" : "none",
        }}
      />

      {/* Picard-era Morganogram reticle overlay (decorative) */}
      <div className="lcars-reticle" aria-hidden />
      <div className="absolute top-1.5 left-1.5 z-[4] pointer-events-none">
        <span className="lcars-chip lcars-chip--rail text-[8px] py-0">
          MORGANOGRAM SCAN ⌁ {String(src).slice(-4) || "0000"}
        </span>
      </div>
      {/* Right-side 0..90 ladder */}
      <div className="absolute right-1 top-2 bottom-6 z-[4] pointer-events-none flex flex-col justify-between text-[7px] lcars-numerals text-titan-teal/85">
        {[90, 70, 50, 30, 10].map((n) => <span key={n}>{n}</span>)}
      </div>
      {/* Bottom letter scale */}
      <div className="absolute bottom-1 left-2 right-2 z-[4] pointer-events-none flex justify-between text-[7px] lcars-mono text-titan-teal/85">
        {["S.T.", "S.B.", "J.M.", "M.F.", "L.V."].map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
