import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Shop() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
        <Camera className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">Shopping Mode</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Snap a photo of something you're eyeing while shopping and instantly see how it pairs with your wardrobe.
        </p>
      </div>
      <div className="flex gap-3">
        <Button className="gap-2">
          <Camera className="h-4 w-4" /> Take Photo
        </Button>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" /> Upload
        </Button>
      </div>
    </div>
  );
}
