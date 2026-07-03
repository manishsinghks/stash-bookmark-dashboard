import { api } from "@/api/client";
import { collectTabMetadata, saveBookmark } from "@/services/save";
import { notify } from "@/background/notifications";
import { suggestCategory } from "@/utils/smart-category";
import { fallbackFavicon, isSavableUrl } from "@/utils/url";
import type { SaveBookmarkInput } from "@/types";

/** Best-effort smart category; never blocks a save if the API is down. */
async function suggestedCategoryId(url: string): Promise<string | null> {
  try {
    const categories = await api.categories();
    return suggestCategory(url, categories)?.id ?? null;
  } catch {
    return null;
  }
}

async function finalize(input: SaveBookmarkInput): Promise<void> {
  const outcome = await saveBookmark(input);
  switch (outcome.status) {
    case "saved":
      await notify("Bookmark saved", outcome.name);
      break;
    case "queued":
      await notify("Saved offline", `“${outcome.name}” will sync when the dashboard is back.`);
      break;
    case "duplicate":
      await notify("Already saved", `“${outcome.name}” is already in your Stash.`);
      break;
    case "error":
      await notify("Couldn't save bookmark", outcome.message);
      break;
  }
}

/** One-click / ⌘⇧S save of the current tab, no popup involved. */
export async function quickSaveTab(tab: chrome.tabs.Tab): Promise<void> {
  if (!isSavableUrl(tab.url)) {
    await notify("Can't save this page", "Only http(s) pages can be bookmarked.");
    return;
  }
  const page = await collectTabMetadata(tab);
  await finalize({
    url: page.url,
    name: page.title,
    description: page.description,
    faviconUrl: page.faviconUrl,
    ogImageUrl: page.ogImageUrl,
    themeColor: page.themeColor,
    categoryId: await suggestedCategoryId(page.url),
  });
}

/** Context menu: save a link without visiting it (server-side metadata). */
export async function saveLink(linkUrl: string): Promise<void> {
  let name = new URL(linkUrl).hostname.replace(/^www\./, "");
  let description: string | null = null;
  let ogImageUrl: string | null = null;
  let faviconUrl: string | null = fallbackFavicon(linkUrl);
  try {
    const metadata = await api.metadata(linkUrl);
    name = metadata.title ?? name;
    description = metadata.description;
    ogImageUrl = metadata.ogImageUrl;
    faviconUrl = metadata.faviconUrl ?? faviconUrl;
  } catch {
    // Offline or blocked — save with what we have.
  }
  await finalize({
    url: linkUrl,
    name,
    description,
    ogImageUrl,
    faviconUrl,
    categoryId: await suggestedCategoryId(linkUrl),
  });
}

export async function saveImage(srcUrl: string, pageUrl?: string): Promise<void> {
  const domain = new URL(pageUrl ?? srcUrl).hostname.replace(/^www\./, "");
  await finalize({
    url: srcUrl,
    name: `Image from ${domain}`,
    ogImageUrl: srcUrl,
    faviconUrl: fallbackFavicon(pageUrl ?? srcUrl),
    tags: ["image"],
  });
}

export async function saveSelection(
  selectionText: string,
  tab: chrome.tabs.Tab
): Promise<void> {
  if (!isSavableUrl(tab.url)) return;
  const page = await collectTabMetadata(tab);
  await finalize({
    url: page.url,
    name: page.title,
    description: page.description,
    notes: `“${selectionText.slice(0, 3900)}”`,
    faviconUrl: page.faviconUrl,
    ogImageUrl: page.ogImageUrl,
    categoryId: await suggestedCategoryId(page.url),
  });
}
