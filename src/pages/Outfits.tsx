import { Heart } from "lucide-react";

export default function Outfits() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <Heart className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">Saved Outfits</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Your favorite outfit combinations will appear here. Start by exploring matches from your wardrobe.
        </p>
      </div>
    </div>
  );
}
