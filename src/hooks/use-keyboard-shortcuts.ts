"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useUiStore } from "@/stores/ui-store";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/**
 * Global shortcuts: ⌘K search, ⌘N new bookmark, ⌘D theme toggle.
 * Card-level keys (Enter/E/Delete/arrows) live on the cards themselves.
 */
export function useKeyboardShortcuts() {
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const openAddBookmark = useUiStore((state) => state.openAddBookmark);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;

      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        setCommandOpen(!useUiStore.getState().commandOpen);
      } else if (key === "n" && !isTypingTarget(event.target)) {
        event.preventDefault();
        openAddBookmark();
      } else if (key === "d" && !isTypingTarget(event.target)) {
        event.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen, openAddBookmark, resolvedTheme, setTheme]);
}
