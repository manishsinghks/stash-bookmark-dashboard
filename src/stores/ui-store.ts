"use client";

import { create } from "zustand";
import type { BookmarkDto } from "@/types";

interface UiState {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  bookmarkDialogOpen: boolean;
  editingBookmark: BookmarkDto | null;
  prefillUrl: string | null;
  openAddBookmark: (prefillUrl?: string) => void;
  openEditBookmark: (bookmark: BookmarkDto) => void;
  closeBookmarkDialog: () => void;

  importOpen: boolean;
  setImportOpen: (open: boolean) => void;

  selectedIds: string[];
  toggleSelected: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;

  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),

  bookmarkDialogOpen: false,
  editingBookmark: null,
  prefillUrl: null,
  openAddBookmark: (prefillUrl) =>
    set({ bookmarkDialogOpen: true, editingBookmark: null, prefillUrl: prefillUrl ?? null }),
  openEditBookmark: (bookmark) =>
    set({ bookmarkDialogOpen: true, editingBookmark: bookmark, prefillUrl: null }),
  closeBookmarkDialog: () =>
    set({ bookmarkDialogOpen: false, editingBookmark: null, prefillUrl: null }),

  importOpen: false,
  setImportOpen: (importOpen) => set({ importOpen }),

  selectedIds: [],
  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((existing) => existing !== id)
        : [...state.selectedIds, id],
    })),
  selectMany: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  focusedId: null,
  setFocusedId: (focusedId) => set({ focusedId }),
}));
