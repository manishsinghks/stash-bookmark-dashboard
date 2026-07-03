"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ACCENTS = ["violet", "blue", "teal", "rose", "amber", "green"] as const;
export type Accent = (typeof ACCENTS)[number];

export const DENSITIES = ["compact", "comfortable", "spacious"] as const;
export type Density = (typeof DENSITIES)[number];

export type ViewMode = "grid" | "list";
export type SortOption = "newest" | "oldest" | "alphabetical" | "most-visited";

interface SettingsState {
  accent: Accent;
  density: Density;
  defaultView: ViewMode;
  defaultSort: SortOption;
  setAccent: (accent: Accent) => void;
  setDensity: (density: Density) => void;
  setDefaultView: (view: ViewMode) => void;
  setDefaultSort: (sort: SortOption) => void;
  reset: () => void;
}

const DEFAULTS = {
  accent: "violet" as Accent,
  density: "comfortable" as Density,
  defaultView: "grid" as ViewMode,
  defaultSort: "newest" as SortOption,
};

export const SETTINGS_STORAGE_KEY = "bmd-settings";

function applyAccent(accent: Accent) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.accent = accent;
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setAccent: (accent) => {
        applyAccent(accent);
        set({ accent });
      },
      setDensity: (density) => set({ density }),
      setDefaultView: (defaultView) => set({ defaultView }),
      setDefaultSort: (defaultSort) => set({ defaultSort }),
      reset: () => {
        applyAccent(DEFAULTS.accent);
        set(DEFAULTS);
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) applyAccent(state.accent);
      },
    }
  )
);
