import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");

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

  const updateName = useMutation({
    mutationFn: async (displayName: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Display name updated");
      setEditing(false);
    },
    onError: () => toast.error("Failed to update name"),
  });

  const startEditing = () => {
    setNameInput(profile?.display_name ?? "");
    setEditing(true);
  };

  const displayName = profile?.display_name || "Demo User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-foreground">Style Profile</h2>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="h-4 w-4 mr-1.5" />
          Log out
        </Button>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Your name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateName.mutate(nameInput);
                    if (e.key === "Escape") setEditing(false);
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => updateName.mutate(nameInput)}
                  disabled={updateName.isPending}
                >
                  {updateName.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setEditing(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-medium text-card-foreground">{displayName}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEditing}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{profile?.style_mood ?? "Neutral & Bold"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Skin Tone</p>
            <p className="text-sm font-medium text-card-foreground mt-1">{profile?.skin_tone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Body Type</p>
            <p className="text-sm font-medium text-card-foreground mt-1">{profile?.body_type ?? "—"}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Color Preferences</p>
          <div className="flex flex-wrap gap-2">
            {(profile?.color_preferences ?? []).length > 0
              ? profile!.color_preferences!.map((pref) => (
                  <Badge key={pref} variant="secondary">{pref}</Badge>
                ))
              : <p className="text-sm text-muted-foreground">No preferences set</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
