import { quickSaveTab, saveImage, saveLink, saveSelection } from "@/background/quick-save";

const MENU = {
  page: "stash-save-page",
  link: "stash-save-link",
  image: "stash-save-image",
  selection: "stash-save-selection",
} as const;

export function createContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU.page,
      title: "Save page to Stash",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: MENU.link,
      title: "Save link to Stash",
      contexts: ["link"],
    });
    chrome.contextMenus.create({
      id: MENU.image,
      title: "Save image to Stash",
      contexts: ["image"],
    });
    chrome.contextMenus.create({
      id: MENU.selection,
      title: "Save selection to Stash",
      contexts: ["selection"],
    });
  });
}

export async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void> {
  switch (info.menuItemId) {
    case MENU.page:
      if (tab) await quickSaveTab(tab);
      break;
    case MENU.link:
      if (info.linkUrl) await saveLink(info.linkUrl);
      break;
    case MENU.image:
      if (info.srcUrl) await saveImage(info.srcUrl, info.pageUrl);
      break;
    case MENU.selection:
      if (info.selectionText && tab) await saveSelection(info.selectionText, tab);
      break;
  }
}
