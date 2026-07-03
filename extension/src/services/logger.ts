import type { LogEntry } from "@/types";

const STORAGE_KEY = "stash-logs";
const MAX_ENTRIES = 300;

/**
 * Small persistent ring buffer so the options page can export logs
 * for debugging. Never logs page content or user notes — only events.
 */
export async function log(
  level: LogEntry["level"],
  message: string,
  data?: unknown
): Promise<void> {
  try {
    const entry: LogEntry = {
      time: new Date().toISOString(),
      level,
      message,
      ...(data !== undefined ? { data } : {}),
    };
    const raw = await chrome.storage.local.get(STORAGE_KEY);
    const entries: LogEntry[] = Array.isArray(raw[STORAGE_KEY]) ? raw[STORAGE_KEY] : [];
    entries.push(entry);
    await chrome.storage.local.set({
      [STORAGE_KEY]: entries.slice(-MAX_ENTRIES),
    });
  } catch {
    // Logging must never break the feature it's observing.
  }
}

export async function getLogs(): Promise<LogEntry[]> {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(raw[STORAGE_KEY]) ? raw[STORAGE_KEY] : [];
}

export async function clearLogs(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
