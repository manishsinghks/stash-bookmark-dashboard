import { queueCount, syncQueue, type SyncResult } from "@/services/queue";
import { notifyDashboardTabs } from "@/services/save";
import { notify } from "@/background/notifications";

const SYNC_ALARM = "stash-sync";

/** Pending-count badge on the toolbar icon (violet, matches the brand). */
export async function updateBadge(count?: number): Promise<void> {
  const pending = count ?? (await queueCount());
  await chrome.action.setBadgeBackgroundColor({ color: "#6E56CF" });
  await chrome.action.setBadgeText({ text: pending > 0 ? String(pending) : "" });
}

export function scheduleSyncAlarm(): void {
  // A standing 2-minute heartbeat; syncQueue() exits immediately when
  // the queue is empty, so the steady-state cost is one storage read.
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 2 });
}

export function isSyncAlarm(alarm: chrome.alarms.Alarm): boolean {
  return alarm.name === SYNC_ALARM;
}

export async function runSync(options: { quiet?: boolean } = {}): Promise<SyncResult> {
  const result = await syncQueue();
  await updateBadge(result.remaining);

  if (result.synced > 0) {
    void notifyDashboardTabs();
    if (!options.quiet) {
      await notify(
        "Sync complete",
        `${result.synced} offline bookmark${result.synced > 1 ? "s" : ""} synced to your Stash.`
      );
    }
  }
  if (result.failed > 0 && !options.quiet) {
    await notify(
      "Sync issue",
      `${result.failed} bookmark${result.failed > 1 ? "s" : ""} couldn't be synced and were skipped.`
    );
  }
  return result;
}
