import { exportWardrobeItems, validImportedItem, importedItemRow } from "@/lib/wardrobe-export";
import { exportFile } from "@/lib/export-file";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, AlertTriangle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type WardrobeItem } from "@/lib/wardrobe-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ... keep existing code (interfaces)
interface ExportImportButtonsProps {
  userId: string;
  allItems: WardrobeItem[];
}

interface ParsedImport {
  valid: any[];
  skipped: number;
  duplicates: any[];
  newItems: any[];
}

export default function ExportImportButtons({ userId, allItems }: ExportImportButtonsProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<ParsedImport | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // ... keep existing code (handleExport)
  const handleExport = async () => {
    const payload = exportWardrobeItems(allItems);

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    try {
      await exportFile(blob, `wardrobe-export-${new Date().toISOString().slice(0, 10)}.json`);
    } catch {
      toast.error("Unable to export wardrobe. Please try again.");
      return;
    }
    toast.success(`Exported ${payload.items.length} items with front/back photo links. Keep your original photo files; this export does not contain image files.`);
  };

  // ... keep existing code (handleFileSelected)
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Choose a wardrobe JSON file smaller than 10 MB.");
      const text = await file.text();
      const parsed = JSON.parse(text);

      let rawItems: any[];
      if (Array.isArray(parsed)) {
        rawItems = parsed;
      } else if (parsed && Array.isArray(parsed.items)) {
        rawItems = parsed.items;
      } else {
        throw new Error("Invalid wardrobe JSON format");
      }

      if (rawItems.length > 5000) throw new Error("Import up to 5,000 items at a time.");
      const valid = rawItems.filter(validImportedItem);
      const skipped = rawItems.length - valid.length;

      if (valid.length === 0) {
        toast.error("No valid items found in file");
        return;
      }

      const existingNames = new Set(allItems.map((i) => i.name.toLowerCase()));
      const duplicates = valid.filter((item: any) => existingNames.has(item.name.toLowerCase()));
      const newItems = valid.filter((item: any) => !existingNames.has(item.name.toLowerCase()));

      setPendingImport({ valid, skipped, duplicates, newItems });
      setSkipDuplicates(duplicates.length > 0);
      setConfirmOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to read file");
    }
  };

  const executeImport = async () => {
    if (!pendingImport) return;
    const { valid, skipped, newItems, duplicates } = pendingImport;

    const itemsToInsert = skipDuplicates ? newItems : valid;

    if (itemsToInsert.length === 0) {
      toast("All items are duplicates — nothing to import");
      cancelImport();
      return;
    }

    setConfirmOpen(false);
    setImporting(true);
    try {
      const BATCH = 50;
      let inserted = 0;
      for (let i = 0; i < itemsToInsert.length; i += BATCH) {
        const batch = itemsToInsert.slice(i, i + BATCH).map(item => importedItemRow(item, userId));

        const { error } = await supabase.from("wardrobe_items").insert(batch);
        if (error) throw error;
        inserted += batch.length;
      }

      const dupSkipped = skipDuplicates ? duplicates.length : 0;
      queryClient.invalidateQueries({ queryKey: ["wardrobe-items"] });
      toast.success(
        `Imported ${inserted} items${dupSkipped > 0 ? ` (${dupSkipped} duplicates skipped)` : ""}${skipped > 0 ? ` (${skipped} invalid skipped)` : ""}`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to import");
    } finally {
      setImporting(false);
      setPendingImport(null);
    }
  };

  const cancelImport = () => {
    setConfirmOpen(false);
    setPendingImport(null);
  };

  const importCount = pendingImport
    ? skipDuplicates
      ? pendingImport.newItems.length
      : pendingImport.valid.length
    : 0;

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport}>
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
      >
        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Import
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelected}
      />

      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!open) cancelImport(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Import Items?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Found <strong className="text-foreground">{pendingImport?.valid.length}</strong> valid items in file.
                  {(pendingImport?.skipped ?? 0) > 0 && (
                    <> ({pendingImport?.skipped} invalid items will be skipped.)</>
                  )}
                </p>
                {(pendingImport?.duplicates.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5">
                      <Copy className="h-3.5 w-3.5 text-destructive" />
                      <strong className="text-foreground">{pendingImport?.duplicates.length}</strong> items already exist in your wardrobe:
                    </p>
                    <ScrollArea className="max-h-32 rounded-md border bg-muted/50 p-2">
                      <div className="flex flex-wrap gap-1.5">
                        {pendingImport?.duplicates.map((item: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">
                            {item.name}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex items-center gap-2 rounded-md border p-2.5">
                      <Checkbox
                        id="skip-duplicates"
                        checked={skipDuplicates}
                        onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
                      />
                      <Label htmlFor="skip-duplicates" className="text-sm cursor-pointer">
                        Skip duplicates (import only new items)
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeImport} disabled={importCount === 0}>
              Import {importCount} {importCount === 1 ? "Item" : "Items"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
