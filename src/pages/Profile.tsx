import { Badge } from "@/components/ui/badge";

const DEMO_PROFILE = {
  name: "Demo User",
  skin_tone: "Dark",
  body_type: "Athletic",
  style_mood: "Neutral & Bold",
  color_preferences: ["Earth Tones", "Warm Neutrals", "Bold Accents"],
};

export default function Profile() {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-semibold text-foreground">Style Profile</h2>

      <div className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
            D
          </div>
          <div>
            <p className="font-medium text-card-foreground">{DEMO_PROFILE.name}</p>
            <p className="text-sm text-muted-foreground">{DEMO_PROFILE.style_mood}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Skin Tone</p>
            <p className="text-sm font-medium text-card-foreground mt-1">{DEMO_PROFILE.skin_tone}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Body Type</p>
            <p className="text-sm font-medium text-card-foreground mt-1">{DEMO_PROFILE.body_type}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Color Preferences</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_PROFILE.color_preferences.map((pref) => (
              <Badge key={pref} variant="secondary">{pref}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
