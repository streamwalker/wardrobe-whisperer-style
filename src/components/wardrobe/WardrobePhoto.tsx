import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Keep the item usable when an original photo cannot be reached. Never replace its saved URL. */
export default function WardrobePhoto({ src, alt, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSrc, setFailedSrc] = useState<string>();
  if (!src || failedSrc === src) {
    return <div role="img" aria-label={`${alt ?? 'Clothing'} — photo unavailable`} className={cn('flex h-full w-full flex-col items-center justify-center gap-2 bg-background/90 p-3 text-center text-foreground', className)}>
      <ImageOff aria-hidden="true" className="h-6 w-6" />
      <span className="text-xs font-medium">Photo unavailable</span>
      <span className="text-[10px]">Your clothing details are saved.</span>
    </div>;
  }
  return <img {...props} src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />;
}
