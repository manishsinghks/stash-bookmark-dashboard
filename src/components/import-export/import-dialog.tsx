"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileUp, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseImportFile, type ImportItem } from "@/lib/importers";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

type Step = "pick" | "preview" | "done";

async function postImport(items: ImportItem[]) {
  const response = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, createCollections: true }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? "Import failed");
  return body.data as { imported: number; skipped: number; total: number };
}

export function ImportDialog() {
  const open = useUiStore((state) => state.importOpen);
  const setOpen = useUiStore((state) => state.setImportOpen);
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("pick");
  const [items, setItems] = useState<ImportItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const importMutation = useMutation({
    mutationFn: postImport,
    onSuccess: (data) => {
      setResult(data);
      setStep("done");
      queryClient.invalidateQueries();
    },
    onError: (error) => toast.error("Import failed", { description: error.message }),
  });

  const reset = useCallback(() => {
    setStep("pick");
    setItems([]);
    setFileName("");
    setResult(null);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const { items: parsed, format } = parseImportFile(file.name, text);
      if (parsed.length === 0) {
        toast.error("No bookmarks found in that file", {
          description: `Parsed as ${format.toUpperCase()} but found no valid links.`,
        });
        return;
      }
      setItems(parsed);
      setFileName(file.name);
      setStep("preview");
    } catch (error) {
      toast.error("Couldn't read that file", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import bookmarks</DialogTitle>
          <DialogDescription>
            Bring bookmarks from Chrome, Edge, Firefox, Brave, Safari (exported HTML),
            or a JSON/CSV file. Duplicates are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "pick" && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  const file = event.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/40"
                )}
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <UploadCloud className="size-6 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    Drop a bookmarks file here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    .html (browser export) · .json · .csv — up to 5,000 bookmarks
                  </p>
                </div>
                <input
                  type="file"
                  accept=".html,.htm,.json,.csv"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFile(file);
                    event.target.value = "";
                  }}
                />
              </label>
              <p className="mt-3 text-xs text-muted-foreground">
                Tip: in Chrome, go to Bookmarks Manager → ⋮ → Export bookmarks.
              </p>
            </motion.div>
          )}

          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-sm">
                <FileUp className="size-4 text-primary" />
                <span className="font-medium">{fileName}</span>
                <Badge variant="secondary" className="tabular-nums">
                  {items.length} bookmarks
                </Badge>
              </div>

              <div className="max-h-64 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Folder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.slice(0, 50).map((item, index) => (
                      <TableRow key={`${item.url}-${index}`}>
                        <TableCell className="max-w-40 truncate font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="max-w-52 truncate text-muted-foreground">
                          {item.url}
                        </TableCell>
                        <TableCell className="max-w-28 truncate text-muted-foreground">
                          {item.folder ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {items.length > 50 && (
                  <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                    …and {items.length - 50} more
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={reset}>
                  Choose another file
                </Button>
                <Button
                  onClick={() => importMutation.mutate(items)}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending && <Loader2 className="animate-spin" />}
                  Import {items.length} bookmarks
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === "done" && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-center gap-3 py-8 text-center"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
                className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10"
              >
                <CheckCircle2 className="size-7 text-emerald-500" />
              </motion.span>
              <div>
                <p className="font-medium">Imported {result.imported} bookmarks</p>
                {result.skipped > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.skipped} duplicates were skipped.
                  </p>
                )}
              </div>
              <Button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
