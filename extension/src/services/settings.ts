import { z } from "zod";

export const settingsSchema = z.object({
  dashboardUrl: z.url().default("http://localhost:3000"),
  autoSave: z.boolean().default(false),
  notifications: z.boolean().default(true),
  offlineQueue: z.boolean().default(true),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  developerMode: z.boolean().default(false),
});

export type ExtensionSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: ExtensionSettings = settingsSchema.parse({});

const STORAGE_KEY = "stash-settings";

/** Settings live in chrome.storage.sync so they roam with the browser profile. */
export async function getSettings(): Promise<ExtensionSettings> {
  const raw = await chrome.storage.sync.get(STORAGE_KEY);
  const parsed = settingsSchema.safeParse(raw[STORAGE_KEY] ?? {});
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function updateSettings(
  patch: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const current = await getSettings();
  const next = settingsSchema.parse({ ...current, ...patch });
  await chrome.storage.sync.set({ [STORAGE_KEY]: next });
  return next;
}

export function onSettingsChanged(
  callback: (settings: ExtensionSettings) => void
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string
  ) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      const parsed = settingsSchema.safeParse(changes[STORAGE_KEY].newValue ?? {});
      callback(parsed.success ? parsed.data : DEFAULT_SETTINGS);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

/** Base URL with no trailing slash, safe to concatenate API paths onto. */
export function apiBase(settings: ExtensionSettings): string {
  return settings.dashboardUrl.replace(/\/+$/, "");
}
