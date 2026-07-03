import { getSettings } from "@/services/settings";

/** Respects the user's notification preference; icon matches the brand. */
export async function notify(title: string, message: string): Promise<void> {
  const settings = await getSettings();
  if (!settings.notifications) return;
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title,
      message,
      silent: true,
    });
  } catch {
    // Notifications are best-effort (some Linux setups reject them).
  }
}
