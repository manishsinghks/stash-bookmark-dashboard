"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Download,
  Monitor,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { getIcon } from "@/lib/icons";
import { parseJson } from "@/lib/importers";
import { useCategories, useDeleteCategory } from "@/hooks/use-taxonomies";
import {
  ACCENTS,
  DENSITIES,
  useSettingsStore,
  type Accent,
  type SortOption,
} from "@/stores/settings-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const ACCENT_SWATCHES: Record<Accent, string> = {
  violet: "#6E56CF",
  blue: "#3B82F6",
  teal: "#14B8A6",
  rose: "#F43F5E",
  amber: "#F59E0B",
  green: "#22C55E",
};

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  alphabetical: "A to Z",
  "most-visited": "Most visited",
};

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-xl border bg-card p-5 shadow-soft">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 mb-4 text-xs text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

export function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const settings = useSettingsStore();
  const { data: categories } = useCategories();
  const deleteCategory = useDeleteCategory();
  const setImportOpen = useUiStore((state) => state.setImportOpen);
  const queryClient = useQueryClient();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const backup = () => {
    const link = document.createElement("a");
    link.href = "/api/export?format=json";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Backup download started");
  };

  const restore = async (file: File) => {
    setRestoring(true);
    try {
      const items = parseJson(await file.text());
      if (items.length === 0) throw new Error("No bookmarks found in that file.");
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, createCollections: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "Restore failed");
      queryClient.invalidateQueries();
      toast.success(`Restored ${body.data.imported} bookmarks`, {
        description:
          body.data.skipped > 0 ? `${body.data.skipped} already existed.` : undefined,
      });
    } catch (error) {
      toast.error("Restore failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Section
        title="Appearance"
        description="Theme, accent color, and how dense the bookmark grid feels."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={theme === option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    theme === option.value && "border-primary/60 bg-primary/5 text-primary"
                  )}
                >
                  <option.icon className="size-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Accent color</Label>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Accent color">
              {ACCENTS.map((accent) => (
                <button
                  key={accent}
                  type="button"
                  role="radio"
                  aria-checked={settings.accent === accent}
                  aria-label={accent}
                  onClick={() => settings.setAccent(accent)}
                  className={cn(
                    "flex size-9 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                    settings.accent === accent &&
                      "ring-2 ring-foreground/60 ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: ACCENT_SWATCHES[accent] }}
                >
                  {settings.accent === accent && <Check className="size-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grid density</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Grid density">
              {DENSITIES.map((density) => (
                <button
                  key={density}
                  type="button"
                  role="radio"
                  aria-checked={settings.density === density}
                  onClick={() => settings.setDensity(density)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-3 py-2.5 text-xs font-medium capitalize transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    settings.density === density &&
                      "border-primary/60 bg-primary/5 text-primary"
                  )}
                >
                  {density}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-sort">Default sort</Label>
            <Select
              value={settings.defaultSort}
              onValueChange={(next) => settings.setDefaultSort(next as SortOption)}
            >
              <SelectTrigger id="default-sort" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section
        title="Categories"
        description="Built-in smart categories plus your custom ones."
      >
        <div className="space-y-1">
          {categories?.map((category) => {
            const Icon = getIcon(category.icon);
            return (
              <div
                key={category.id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/60"
              >
                <span
                  className="flex size-7 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${category.color} 12%, transparent)`,
                  }}
                >
                  <Icon className="size-3.5" style={{ color: category.color }} />
                </span>
                <span className="flex-1 text-sm">{category.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {category.count}
                </span>
                {category.isCustom ? (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Delete category ${category.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteCategory.mutate(category.id)}
                  >
                    <Trash2 />
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    built-in
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setCategoryDialogOpen(true)}
        >
          <Plus /> New category
        </Button>
      </Section>

      <Section
        id="backup"
        title="Backup & data"
        description="Your bookmarks live in a local database. Keep a copy safe."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={backup}>
            <Download /> Backup (JSON)
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={restoring}
            onClick={() => restoreInputRef.current?.click()}
          >
            <Upload /> {restoring ? "Restoring…" : "Restore backup"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload /> Import from browser
          </Button>
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json"
            className="sr-only"
            aria-label="Restore backup file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) restore(file);
              event.target.value = "";
            }}
          />
        </div>
      </Section>

      <Section
        title="Preferences"
        description="Reset the interface back to its defaults."
      >
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setResetConfirmOpen(true)}
        >
          <RotateCcw /> Reset preferences
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Resets theme, accent, density, and default sort. Your bookmarks are not touched.
        </p>
      </Section>

      <CategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all preferences?</AlertDialogTitle>
            <AlertDialogDescription>
              Theme, accent color, density, and defaults go back to factory settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                settings.reset();
                setTheme("system");
                toast.success("Preferences reset");
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
