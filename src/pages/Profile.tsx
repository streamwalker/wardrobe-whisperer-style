import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X, Loader2, LogOut, Save, Link2, Link2Off, Copy, ExternalLink, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const STYLE_MOODS = ["neutral", "bold", "luxury", "streetwear", "classic", "minimalist"];
const SKIN_TONES = ["Fair", "Light", "Medium", "Olive", "Tan", "Brown", "Dark"];
const BODY_TYPES = ["Slim", "Athletic", "Average", "Muscular", "Stocky", "Husky", "Big & Tall"];
const COLOR_OPTIONS = ["Neutrals", "Earth Tones", "Cool Tones", "Warm Tones", "Bold Colors", "Pastels", "Monochrome", "Jewel Tones"];

type ProfileData = {
  display_name: string;
  style_mood: string;
  skin_tone: string;
  body_type: string;
  color_preferences: string[];
  height: string;
  weight: string;
  shoulder: string;
  waist: string;
  thigh: string;
  inseam: string;
  suit_size: string;
  shoe_size: string;
};

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate("/auth");
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated");
      setEditingSection(null);
      setEditingName(false);
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const startEditingSection = (section: string) => {
    setFormData({
      style_mood: profile?.style_mood ?? "",
      skin_tone: profile?.skin_tone ?? "",
      body_type: profile?.body_type ?? "",
      color_preferences: profile?.color_preferences ?? [],
      height: (profile as any)?.height ?? "",
      weight: (profile as any)?.weight ?? "",
      shoulder: (profile as any)?.shoulder ?? "",
      waist: (profile as any)?.waist ?? "",
      thigh: (profile as any)?.thigh ?? "",
      inseam: (profile as any)?.inseam ?? "",
      suit_size: (profile as any)?.suit_size ?? "",
      shoe_size: (profile as any)?.shoe_size ?? "",
    });
    setEditingSection(section);
  };

  const saveSection = (fields: string[]) => {
    const updates: Record<string, unknown> = {};
    fields.forEach((f) => {
      updates[f] = (formData as any)[f] ?? null;
    });
    updateProfile.mutate(updates);
  };

  const toggleColorPref = (color: string) => {
    const current = formData.color_preferences ?? [];
    setFormData({
      ...formData,
      color_preferences: current.includes(color)
        ? current.filter((c) => c !== color)
        : [...current, color],
    });
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const SectionHeader = ({ label, section, fields }: { label: string; section: string; fields: string[] }) => (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      {editingSection === section ? (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveSection(fields)} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingSection(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditingSection(section)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-foreground">Style Profile</h2>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="h-4 w-4 mr-1.5" />
          Log out
        </Button>
      </div>

      {/* Name & Mood */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Your name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateProfile.mutate({ display_name: nameInput.trim() });
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => updateProfile.mutate({ display_name: nameInput.trim() })} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditingName(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-medium text-card-foreground">{displayName}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setNameInput(profile?.display_name ?? ""); setEditingName(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground capitalize">{profile?.style_mood ?? "neutral"}</p>
          </div>
        </div>
      </div>

      {/* Style & Appearance */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <SectionHeader label="Style & Appearance" section="style" fields={["style_mood", "skin_tone", "body_type"]} />

        {editingSection === "style" ? (
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Style Mood</Label>
              <Select value={formData.style_mood ?? ""} onValueChange={(v) => setFormData({ ...formData, style_mood: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select mood" /></SelectTrigger>
                <SelectContent>
                  {STYLE_MOODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Skin Tone</Label>
              <Select value={formData.skin_tone ?? ""} onValueChange={(v) => setFormData({ ...formData, skin_tone: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select skin tone" /></SelectTrigger>
                <SelectContent>
                  {SKIN_TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Body Type</Label>
              <Select value={formData.body_type ?? ""} onValueChange={(v) => setFormData({ ...formData, body_type: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select body type" /></SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase">Mood</p>
              <p className="text-sm font-medium text-card-foreground mt-0.5 capitalize">{profile?.style_mood ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase">Skin Tone</p>
              <p className="text-sm font-medium text-card-foreground mt-0.5">{profile?.skin_tone ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase">Body Type</p>
              <p className="text-sm font-medium text-card-foreground mt-0.5">{profile?.body_type ?? "—"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Color Preferences */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <SectionHeader label="Color Preferences" section="colors" fields={["color_preferences"]} />

        {editingSection === "colors" ? (
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                onClick={() => toggleColorPref(color)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  (formData.color_preferences ?? []).includes(color)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(profile?.color_preferences ?? []).length > 0
              ? profile!.color_preferences!.map((pref) => (
                  <Badge key={pref} variant="secondary">{pref}</Badge>
                ))
              : <p className="text-sm text-muted-foreground">No preferences set</p>
            }
          </div>
        )}
      </div>

      {/* Body Measurements */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <SectionHeader label="Body Measurements" section="measurements" fields={["height", "weight", "shoulder", "waist", "thigh", "inseam"]} />

        {editingSection === "measurements" ? (
          <div className="grid grid-cols-2 gap-3">
            {([
              ["height", "Height (e.g. 5'11\")"],
              ["weight", "Weight (e.g. 185 lbs)"],
              ["shoulder", "Shoulder (inches)"],
              ["waist", "Waist (inches)"],
              ["thigh", "Thigh (inches)"],
              ["inseam", "Inseam (inches)"],
            ] as const).map(([field, placeholder]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs capitalize">{field}</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder={placeholder}
                  value={(formData as any)[field] ?? ""}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            {([
              ["Height", (profile as any)?.height],
              ["Weight", (profile as any)?.weight],
              ["Shoulder", (profile as any)?.shoulder],
              ["Waist", (profile as any)?.waist],
              ["Thigh", (profile as any)?.thigh],
              ["Inseam", (profile as any)?.inseam],
            ] as const).map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
                <p className="text-sm font-medium text-card-foreground mt-0.5">{value || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sizing */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <SectionHeader label="Suit & Shoe Sizing" section="sizing" fields={["suit_size", "shoe_size"]} />

        {editingSection === "sizing" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Suit Jacket Size</Label>
              <Input
                className="h-9 text-sm"
                placeholder="e.g. 42 Long"
                value={formData.suit_size ?? ""}
                onChange={(e) => setFormData({ ...formData, suit_size: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Shoe Size</Label>
              <Input
                className="h-9 text-sm"
                placeholder="e.g. 10.5"
                value={formData.shoe_size ?? ""}
                onChange={(e) => setFormData({ ...formData, shoe_size: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase">Suit Jacket</p>
              <p className="text-sm font-medium text-card-foreground mt-0.5">{(profile as any)?.suit_size || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase">Shoe Size</p>
              <p className="text-sm font-medium text-card-foreground mt-0.5">{(profile as any)?.shoe_size || "—"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Wardrobe Sharing */}
      <ShareSection userId={user?.id} />
    </div>
  );
}

/* ── Share Management Section ─────────────────── */

function ShareSection({ userId }: { userId?: string }) {
  const queryClient = useQueryClient();
  const [linkCopied, setLinkCopied] = useState(false);

  const { data: activeShare, isLoading } = useQuery({
    queryKey: ["wardrobe-share", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("wardrobe_shares")
        .select("*")
        .eq("user_id", userId!)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!activeShare) return;
      const { error } = await supabase
        .from("wardrobe_shares")
        .update({ is_active: false })
        .eq("id", activeShare.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe-share"] });
      toast.success("Share link revoked");
    },
    onError: () => toast.error("Failed to revoke link"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("wardrobe_shares")
        .insert({ user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe-share"] });
      toast.success("Share link created");
    },
    onError: () => toast.error("Failed to create link"),
  });

  const shareUrl = activeShare
    ? `${window.location.origin}/shared/${activeShare.share_token}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (isLoading) return <Skeleton className="h-24 w-full rounded-lg" />;

  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Wardrobe Sharing</p>
        {activeShare ? (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Link2 className="h-3 w-3" /> Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>
        )}
      </div>

      {activeShare ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Anyone with the link below can view your wardrobe.
          </p>
          <div className="flex items-center gap-2">
            <Input value={shareUrl} readOnly className="text-xs font-mono h-9" />
            <Button size="sm" variant="secondary" className="shrink-0 gap-1.5 h-9" onClick={copyLink}>
              {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="secondary" className="shrink-0 h-9" asChild>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={() => revokeMutation.mutate()}
            disabled={revokeMutation.isPending}
          >
            {revokeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2Off className="h-3.5 w-3.5" />}
            Revoke Link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your wardrobe is private. Create a share link to let others view it.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
            Create Share Link
          </Button>
        </div>
      )}
    </div>
  );
}
