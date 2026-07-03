/**
 * MV3 service worker. All listeners are registered synchronously at the
 * top level (Chrome requirement) and stay lightweight — the worker can
 * be killed and revived between events without losing state, because
 * every piece of state lives in chrome.storage.
 */
import { createContextMenus, handleContextMenuClick } from "@/background/context-menus";
import { quickSaveTab } from "@/background/quick-save";
import { isSyncAlarm, runSync, scheduleSyncAlarm, updateBadge } from "@/background/sync";
import { getSettings, onSettingsChanged } from "@/services/settings";
import { onQueueChanged, queueCount } from "@/services/queue";
import { runtimeMessageSchema, type SyncNowResponse } from "@/types/messages";
import { log } from "@/services/logger";

/** Auto Save Mode: empty popup string routes clicks to action.onClicked. */
async function applyActionMode(autoSave: boolean): Promise<void> {
  await chrome.action.setPopup({ popup: autoSave ? "" : "popup.html" });
  await chrome.action.setTitle({
    title: autoSave ? "Save to Stash (one click)" : "Save to Stash",
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
  scheduleSyncAlarm();
  void getSettings().then((settings) => applyActionMode(settings.autoSave));
  void updateBadge();
  void log("info", "Extension installed/updated");
});

chrome.runtime.onStartup.addListener(() => {
  scheduleSyncAlarm();
  void getSettings().then((settings) => applyActionMode(settings.autoSave));
  void updateBadge();
  void runSync({ quiet: true });
});

onSettingsChanged((settings) => {
  void applyActionMode(settings.autoSave);
});

onQueueChanged((count) => {
  void updateBadge(count);
});

// Fires only in Auto Save Mode (popup unset).
chrome.action.onClicked.addListener((tab) => {
  void quickSaveTab(tab);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "save-page" && tab) {
    void quickSaveTab(tab);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  void handleContextMenuClick(info, tab);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (isSyncAlarm(alarm)) {
    void runSync({ quiet: false });
  }
});

// Typed + validated messaging: never act on unvalidated payloads.
chrome.runtime.onMessage.addListener((rawMessage, _sender, sendResponse) => {
  const parsed = runtimeMessageSchema.safeParse(rawMessage);
  if (!parsed.success) return false;

  const message = parsed.data;
  if (message.type === "sync-now") {
    void runSync({ quiet: true })
      .then((result) =>
        sendResponse({
          ok: true,
          synced: result.synced,
          remaining: result.remaining,
        } satisfies SyncNowResponse)
      )
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          synced: 0,
          remaining: -1,
          error: error instanceof Error ? error.message : "Sync failed",
        } satisfies SyncNowResponse)
      );
    return true; // async response
  }
  if (message.type === "get-queue-count") {
    void queueCount().then((count) => sendResponse({ count }));
    return true;
  }
  return false;
});
