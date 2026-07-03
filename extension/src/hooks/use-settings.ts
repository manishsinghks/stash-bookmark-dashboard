import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  getSettings,
  onSettingsChanged,
  updateSettings,
  type ExtensionSettings,
} from "@/services/settings";

export function useSettings() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSettings().then((value) => {
      if (mounted) {
        setSettings(value);
        setLoaded(true);
      }
    });
    const unsubscribe = onSettingsChanged((value) => setSettings(value));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const update = useCallback(async (patch: Partial<ExtensionSettings>) => {
    const next = await updateSettings(patch);
    setSettings(next);
    return next;
  }, []);

  return { settings, loaded, update };
}

/** Applies light/dark/system to the root element (popup + options). */
export function useTheme(theme: ExtensionSettings["theme"]) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
}
