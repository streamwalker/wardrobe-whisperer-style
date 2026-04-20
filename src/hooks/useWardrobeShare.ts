import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Manages the "Share your wardrobe" dialog state plus the share-link lifecycle.
 *
 * `openShareDialog()` reuses an existing active share token if one exists,
 * otherwise inserts a new row in wardrobe_shares. The resulting public URL
 * is copied to the clipboard when the user taps the copy action; the brief
 * "Copied" confirmation resets after two seconds.
 */
export function useWardrobeShare(userId: string | undefined) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const openShareDialog = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: existing } = await supabase
        .from("wardrobe_shares")
        .select("share_token")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      let token = existing?.share_token;
      if (!token) {
        const { data: newShare, error } = await supabase
          .from("wardrobe_shares")
          .insert({ user_id: userId })
          .select("share_token")
          .single();
        if (error) throw error;
        token = newShare.share_token;
      }

      setShareLink(`${window.location.origin}/shared/${token}`);
      setLinkCopied(false);
      setShareDialogOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to create share link");
    }
  }, [userId]);

  const copyShareLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  }, [shareLink]);

  return {
    shareDialogOpen,
    setShareDialogOpen,
    shareLink,
    linkCopied,
    openShareDialog,
    copyShareLink,
  };
}
