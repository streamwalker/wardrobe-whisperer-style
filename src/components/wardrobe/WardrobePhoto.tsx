import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Keep the item usable when an original photo cannot be reached. Never replace its saved URL. */
export default function WardrobePhoto({ src, alt, className, compact = false, ...props }: ImgHTMLAttributes<HTMLImageElement> & { compact?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  if (!src || failedSrc === src) {
    return <div role="img" aria-label={`${alt ?? 'Clothing'} — photo unavailable`} className={cn('flex h-full w-full flex-col items-center justify-center bg-background/90 text-center text-foreground', compact ? 'gap-1 p-1' : 'gap-2 p-3', className)}>
      <ImageOff aria-hidden="true" className={compact ? "h-4 w-4" : "h-6 w-6"} />
      <span className={compact ? "text-[9px] leading-tight font-medium" : "text-xs font-medium"}>Photo unavailable</span>
      {!compact && <span className="text-[10px]">Your clothing details are saved.</span>}
    </div>;
  }
  return <img {...props} src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />;
}
