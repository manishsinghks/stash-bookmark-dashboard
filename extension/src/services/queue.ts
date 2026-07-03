import { api, ApiError } from "@/api/client";
import { log } from "@/services/logger";
import type { QueuedBookmark, SaveBookmarkInput } from "@/types";

const STORAGE_KEY = "stash-pending-queue";
const MAX_QUEUE = 500;

/**
 * Offline-first save queue in chrome.storage.local. Bookmarks land here
 * whenever the dashboard is unreachable and drain in FIFO order once
 * it's back. Entries survive browser restarts — nothing is ever lost.
 */
export async function getQueue(): Promise<QueuedBookmark[]> {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(raw[STORAGE_KEY]) ? raw[STORAGE_KEY] : [];
}

export async function queueCount(): Promise<number> {
  return (await getQueue()).length;
}

async function setQueue(queue: QueuedBookmark[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: queue.slice(-MAX_QUEUE) });
}

export async function enqueue(input: SaveBookmarkInput): Promise<QueuedBookmark> {
  const entry: QueuedBookmark = {
    id: crypto.randomUUID(),
    input,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };
  const queue = await getQueue();
  await setQueue([...queue, entry]);
  await log("info", "Bookmark queued for offline sync", { url: input.url });
  return entry;
}

export interface SyncResult {
  synced: number;
  remaining: number;
  failed: number;
}

/**
 * Drains the queue one entry at a time. Stops early if the dashboard
 * goes unreachable mid-drain; keeps entries whose failure is permanent
 * out of the retry loop by dropping them after repeated 4xx rejections.
 */
export async function syncQueue(): Promise<SyncResult> {
  let queue = await getQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0, failed: 0 };

  if (!(await api.isReachable())) {
    return { synced: 0, remaining: queue.length, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const entry of [...queue]) {
    try {
      // Duplicate-safe: if the URL landed some other way meanwhile, skip it.
      const existing = await api.lookupBookmark(entry.input.url);
      if (!existing) {
        await api.createBookmark(entry.input);
      }
      queue = queue.filter((queued) => queued.id !== entry.id);
      await setQueue(queue);
      synced += 1;
    } catch (error) {
      const permanent =
        error instanceof ApiError && !error.network && error.status < 500;
      entry.attempts += 1;
      entry.lastError = error instanceof Error ? error.message : String(error);

      if (permanent && entry.attempts >= 3) {
        // Malformed beyond repair — drop it rather than blocking the queue.
        queue = queue.filter((queued) => queued.id !== entry.id);
        failed += 1;
        await log("error", "Dropped unsyncable queued bookmark", {
          url: entry.input.url,
          error: entry.lastError,
        });
      } else {
        queue = queue.map((queued) => (queued.id === entry.id ? entry : queued));
        if (error instanceof ApiError && error.network) {
          // Dashboard went away mid-drain; try again on the next alarm.
          await setQueue(queue);
          return { synced, remaining: queue.length, failed };
        }
      }
      await setQueue(queue);
    }
  }

  if (synced > 0) await log("info", `Synced ${synced} queued bookmarks`);
  return { synced, remaining: queue.length, failed };
}

export function onQueueChanged(callback: (count: number) => void): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string
  ) => {
    if (area === "local" && changes[STORAGE_KEY]) {
      const next = changes[STORAGE_KEY].newValue;
      callback(Array.isArray(next) ? next.length : 0);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
