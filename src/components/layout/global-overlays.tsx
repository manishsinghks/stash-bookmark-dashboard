"use client";

import { BookmarkDialog } from "@/components/bookmarks/bookmark-dialog";
import { CommandPalette } from "@/components/search/command-palette";
import { ImportDialog } from "@/components/import-export/import-dialog";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useExtensionSync } from "@/hooks/use-extension-sync";

export function GlobalOverlays() {
  useKeyboardShortcuts();
  useExtensionSync();

  return (
    <>
      <BookmarkDialog />
      <CommandPalette />
      <ImportDialog />
      <OfflineBanner />
    </>
  );
}
