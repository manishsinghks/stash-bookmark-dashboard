import { api, ApiError } from "@/api/client";
import { ai } from "@/services/ai";
import { log } from "@/services/logger";
import { enqueue } from "@/services/queue";
import { getSettings, apiBase } from "@/services/settings";
import { extractPageMetadata } from "@/content/metadata-extractor";
import { fallbackFavicon, isSavableUrl, normalizeUrl } from "@/utils/url";
import type { PageMetadata, SaveBookmarkInput } from "@/types";

/**
 * Shared save orchestration used by both the popup and the background
 * worker (quick save, shortcut, context menus).
 */

export async function collectTabMetadata(tab: chrome.tabs.Tab): Promise<PageMetadata> {
  const base: PageMetadata = {
    url: tab.url ?? "",
    title: tab.title ?? (tab.url ? new URL(tab.url).hostname : "Untitled"),
    description: null,
    ogImageUrl: null,
    themeColor: null,
    faviconUrl: tab.favIconUrl ?? (tab.url ? fallbackFavicon(tab.url) : null),
    selectionText: null,
  };

  if (!tab.id || !isSavableUrl(tab.url)) return base;

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageMetadata,
    });
    const page = result?.result;
    if (!page) return base;
    return {
      ...base,
      ...page,
      faviconUrl: page.faviconUrl ?? base.faviconUrl,
      title: page.title || base.title,
    };
  } catch {
    // chrome://, Web Store, PDFs etc. deny injection — tab info is enough.
    return base;
  }
}

export type SaveOutcome =
  | { status: "saved"; name: string }
  | { status: "queued"; name: string }
  | { status: "duplicate"; existingId: string; name: string }
  | { status: "error"; message: string };

/**
 * Save with duplicate detection and offline fallback.
 * `onDuplicate: "skip"` reports the duplicate instead of writing anything
 * (quick-save paths); the popup handles duplicates interactively instead.
 */
export async function saveBookmark(
  input: SaveBookmarkInput,
  options: { checkDuplicate?: boolean } = {}
): Promise<SaveOutcome> {
  const settings = await getSettings();
  const normalized = { ...input, url: normalizeUrl(input.url) };

  try {
    if (options.checkDuplicate !== false) {
      const existing = await api.lookupBookmark(normalized.url);
      if (existing) {
        return { status: "duplicate", existingId: existing.id, name: existing.name };
      }
    }
    const page: PageMetadata = {
      url: normalized.url,
      title: normalized.name,
      description: normalized.description ?? null,
      ogImageUrl: normalized.ogImageUrl ?? null,
      themeColor: normalized.themeColor ?? null,
      faviconUrl: normalized.faviconUrl ?? null,
    };
    const enriched = await ai().enrich(normalized, page);
    const bookmark = await api.createBookmark(enriched);
    await log("info", "Bookmark saved", { url: bookmark.url });
    void notifyDashboardTabs();
    return { status: "saved", name: bookmark.name };
  } catch (error) {
    if (error instanceof ApiError && error.network && settings.offlineQueue) {
      await enqueue(normalized);
      return { status: "queued", name: normalized.name };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    await log("error", "Save failed", { url: input.url, message });
    return { status: "error", message };
  }
}

/**
 * Tells any open dashboard tab to refresh its data instantly.
 * The dashboard listens for this postMessage in use-extension-sync.
 */
export async function notifyDashboardTabs(): Promise<void> {
  try {
    const settings = await getSettings();
    const origin = new URL(apiBase(settings)).origin;
    const tabs = await chrome.tabs.query({ url: `${origin}/*` });
    await Promise.all(
      tabs.map((tab) =>
        tab.id
          ? chrome.scripting
              .executeScript({
                target: { tabId: tab.id },
                func: () => window.postMessage({ source: "stash-extension", type: "bookmark-saved" }, "*"),
              })
              .catch(() => undefined)
          : undefined
      )
    );
  } catch {
    // Non-critical: the dashboard also refetches on window focus.
  }
}
