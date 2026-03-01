import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  userId: string;
  transferOpen: boolean;
  redeemOpen: boolean;
  onTransferChange: (open: boolean) => void;
  onRedeemChange: (open: boolean) => void;
}

export default function TransferRedeemDialogs({
  userId,
  transferOpen,
  redeemOpen,
  onTransferChange,
  onRedeemChange,
}: Props) {
  const queryClient = useQueryClient();
  const [transferCode, setTransferCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase
        .from("wardrobe_transfers" as any)
        .insert({ sender_id: userId } as any)
        .select("transfer_code" as any)
        .single();
      if (error) throw error;
      setTransferCode((data as any).transfer_code);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate transfer code");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(transferCode);
    setCodeCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleRedeem = async () => {
    const code = redeemCode.trim();
    if (!code) return;
    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc("redeem_wardrobe_transfer" as any, {
        p_code: code,
      });
      if (error) throw error;
      toast.success(`${data} items copied to your wardrobe!`);
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
      setRedeemCode("");
      onRedeemChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to redeem code");
    } finally {
      setRedeeming(false);
    }
  };

  const handleTransferOpenChange = (open: boolean) => {
    onTransferChange(open);
    if (!open) {
      setTransferCode("");
      setCodeCopied(false);
    }
  };

  return (
    <>
      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={handleTransferOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Your Wardrobe</DialogTitle>
            <DialogDescription>
              Generate a one-time code to share your wardrobe with another user. They'll get a copy of all your items.
            </DialogDescription>
          </DialogHeader>
          {transferCode ? (
            <div className="flex items-center gap-2">
              <Input value={transferCode} readOnly className="text-center font-mono text-lg tracking-widest" />
              <Button size="sm" variant="secondary" className="shrink-0 gap-1.5" onClick={copyCode}>
                {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {codeCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerateCode} disabled={generating} className="w-full">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate Code
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Redeem Dialog */}
      <Dialog open={redeemOpen} onOpenChange={onRedeemChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem a Transfer Code</DialogTitle>
            <DialogDescription>
              Paste a transfer code to copy someone's wardrobe into your account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="Paste code here"
              className="font-mono tracking-widest"
              maxLength={8}
            />
            <Button
              size="sm"
              className="shrink-0"
              onClick={handleRedeem}
              disabled={redeeming || !redeemCode.trim()}
            >
              {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Redeem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
