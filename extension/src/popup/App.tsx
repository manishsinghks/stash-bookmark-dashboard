import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bookmark,
  CheckCircle2,
  CloudOff,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Pencil,
  Settings,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveForm, type SaveFormValues } from "@/popup/save-form";
import { api } from "@/api/client";
import { saveBookmark, notifyDashboardTabs } from "@/services/save";
import { getSettings, apiBase } from "@/services/settings";
import { useCurrentTab } from "@/hooks/use-current-tab";
import { useSettings, useTheme } from "@/hooks/use-settings";
import { useTaxonomies } from "@/hooks/use-taxonomies";
import { suggestCategory } from "@/utils/smart-category";
import { domainOf, normalizeUrl } from "@/utils/url";
import type { BookmarkDto } from "@/types";

type View =
  | { kind: "loading" }
  | { kind: "unsavable" }
  | { kind: "duplicate"; existing: BookmarkDto }
  | { kind: "form"; mode: "create" | "update" | "duplicate"; existingId?: string }
  | { kind: "saving" }
  | { kind: "saved"; queued: boolean };

const spring = { type: "spring", stiffness: 400, damping: 30 } as const;

export function PopupApp() {
  const { settings } = useSettings();
  useTheme(settings.theme);
  const { page, savable, loading: tabLoading } = useCurrentTab();
  const taxonomies = useTaxonomies();

  const [view, setView] = useState<View>({ kind: "loading" });
  const [values, setValues] = useState<SaveFormValues>({
    name: "",
    description: "",
    notes: "",
    categoryId: null,
    collectionId: null,
    tags: [],
    isFavorite: false,
  });
  const [nameError, setNameError] = useState<string>();
  const [queueCount, setQueueCount] = useState(0);
  const initialized = useRef(false);

  const suggested = useMemo(
    () => (page ? suggestCategory(page.url, taxonomies.categories) : null),
    [page, taxonomies.categories]
  );

  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: "get-queue-count" })
      .then((response: { count?: number }) => setQueueCount(response?.count ?? 0))
      .catch(() => undefined);
  }, []);

  // Initialize once tab metadata + taxonomies are in: prefill the form,
  // then check for an existing bookmark with the same URL.
  useEffect(() => {
    if (initialized.current || tabLoading || taxonomies.loading) return;
    initialized.current = true;

    if (!savable || !page) {
      setView({ kind: "unsavable" });
      return;
    }

    setValues((current) => ({
      ...current,
      name: page.title,
      description: page.description ?? "",
      notes: page.selectionText ? `“${page.selectionText}”` : "",
      categoryId: suggested?.id ?? null,
    }));

    if (taxonomies.offline) {
      setView({ kind: "form", mode: "create" });
      return;
    }

    api
      .lookupBookmark(normalizeUrl(page.url))
      .then((existing) => {
        setView(existing ? { kind: "duplicate", existing } : { kind: "form", mode: "create" });
      })
      .catch(() => setView({ kind: "form", mode: "create" }));
  }, [tabLoading, taxonomies.loading, taxonomies.offline, savable, page, suggested]);

  const submit = async (openDashboard: boolean) => {
    if (!page || view.kind !== "form") return;
    if (!values.name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError(undefined);
    const mode = view.mode;
    const existingId = view.existingId;
    setView({ kind: "saving" });

    const payload = {
      url: page.url,
      name: values.name.trim(),
      description: values.description.trim() || null,
      notes: values.notes.trim() || null,
      faviconUrl: page.faviconUrl,
      ogImageUrl: page.ogImageUrl,
      themeColor: page.themeColor,
      categoryId: values.categoryId,
      collectionId: values.collectionId,
      tags: values.tags,
      isFavorite: values.isFavorite,
    };

    let queued = false;
    if (mode === "update" && existingId) {
      try {
        await api.updateBookmark(existingId, payload);
        void notifyDashboardTabs();
      } catch {
        setView({ kind: "form", mode, existingId });
        setNameError("Couldn't update — is the dashboard running?");
        return;
      }
    } else {
      const outcome = await saveBookmark(payload, {
        checkDuplicate: mode !== "duplicate",
      });
      if (outcome.status === "error") {
        setView({ kind: "form", mode, existingId });
        setNameError(outcome.message);
        return;
      }
      if (outcome.status === "duplicate") {
        const existing = await api.lookupBookmark(normalizeUrl(page.url)).catch(() => null);
        if (existing) setView({ kind: "duplicate", existing });
        return;
      }
      queued = outcome.status === "queued";
    }

    setView({ kind: "saved", queued });
    if (openDashboard) {
      const currentSettings = await getSettings();
      await chrome.tabs.create({ url: `${apiBase(currentSettings)}/bookmarks` });
      window.close();
    } else {
      setTimeout(() => window.close(), 1100);
    }
  };

  const openDashboardTab = async (path = "/bookmarks") => {
    const currentSettings = await getSettings();
    await chrome.tabs.create({ url: `${apiBase(currentSettings)}${path}` });
    window.close();
  };

  return (
    <div className="flex w-[380px] flex-col bg-background text-foreground">
      <header className="glass sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 shadow-soft">
          <Bookmark className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
        </span>
        <span className="text-sm font-semibold tracking-tight">Stash</span>
        {taxonomies.offline && (
          <Badge variant="secondary" className="gap-1 text-amber-600 dark:text-amber-400">
            <WifiOff className="size-3" /> Offline
          </Badge>
        )}
        {queueCount > 0 && (
          <Badge variant="secondary" className="tabular-nums">
            {queueCount} pending
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          aria-label="Extension settings"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings />
        </Button>
      </header>

      <div>
        {(view.kind === "loading" || tabLoading) && view.kind !== "unsavable" ? (
          <motion.div key="loading" className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-9 w-full" />
          </motion.div>
        ) : view.kind === "unsavable" ? (
          <motion.div
            key="unsavable"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 px-6 py-10 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
              <Globe className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">This page can't be saved</p>
            <p className="text-xs text-muted-foreground">
              Only regular http(s) pages can be bookmarked — browser pages and the Web Store are
              off-limits to extensions.
            </p>
          </motion.div>
        ) : view.kind === "duplicate" ? (
          <motion.div
            key="duplicate"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="space-y-4 p-4"
          >
            <div className="flex items-start gap-3 rounded-xl border bg-card p-3 shadow-soft">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="size-4.5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Already saved</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  “{view.existing.name}” · added{" "}
                  {new Date(view.existing.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => openDashboardTab("/bookmarks")}>
                <ExternalLink /> Open existing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const existing = view.existing;
                  setValues({
                    name: existing.name,
                    description: existing.description ?? "",
                    notes: existing.notes ?? "",
                    categoryId: existing.categoryId,
                    collectionId: existing.collectionId,
                    tags: existing.tags.map((tag) => tag.name),
                    isFavorite: existing.isFavorite,
                  });
                  setView({ kind: "form", mode: "update", existingId: existing.id });
                }}
              >
                <Pencil /> Update bookmark
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView({ kind: "form", mode: "duplicate" })}
              >
                <Copy /> Create duplicate
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.close()}>
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : view.kind === "saving" ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 px-6 py-14"
          >
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Saving…</p>
          </motion.div>
        ) : view.kind === "saved" ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="flex flex-col items-center gap-3 px-6 py-12 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...spring, delay: 0.05 }}
              className={
                view.queued
                  ? "flex size-12 items-center justify-center rounded-full bg-amber-500/10"
                  : "flex size-12 items-center justify-center rounded-full bg-emerald-500/10"
              }
            >
              {view.queued ? (
                <CloudOff className="size-6 text-amber-500" />
              ) : (
                <CheckCircle2 className="size-6 text-emerald-500" />
              )}
            </motion.span>
            <p className="text-sm font-semibold">
              {view.queued ? "Saved offline" : "Bookmark saved"}
            </p>
            {view.queued && (
              <p className="text-xs text-muted-foreground">
                It will sync automatically when the dashboard is reachable.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="p-4"
          >
            {page && (
              <div className="mb-3 overflow-hidden rounded-xl border bg-card shadow-soft">
                {page.ogImageUrl && (
                  <div className="h-24 w-full overflow-hidden border-b bg-muted">
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <img src={page.ogImageUrl} alt="" className="size-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2.5 p-3">
                  {page.faviconUrl ? (
                    <img src={page.faviconUrl} alt="" className="size-8 rounded-md object-contain p-1" />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                      <Globe className="size-4 text-muted-foreground" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{values.name || page.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{domainOf(page.url)}</p>
                  </div>
                  {view.mode === "update" && (
                    <Badge variant="secondary" className="ml-auto">
                      updating
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <SaveForm
              values={values}
              onChange={setValues}
              categories={taxonomies.categories}
              collections={taxonomies.collections}
              tagSuggestions={taxonomies.tags}
              suggestedCategoryId={suggested?.id ?? null}
              nameError={nameError}
            />

            <div className="mt-4 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => window.close()}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => void submit(true)}
              >
                Save & open dashboard
              </Button>
              <Button size="sm" onClick={() => void submit(false)}>
                {view.mode === "update" ? "Update" : "Save"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
