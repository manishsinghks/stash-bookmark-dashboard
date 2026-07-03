"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Bookmark, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookmarkCard } from "@/components/bookmarks/bookmark-card";
import { BookmarkGridSkeleton } from "@/components/bookmarks/bookmark-skeleton";
import { BulkActionBar } from "@/components/bookmarks/bulk-action-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { useBookmarksInfinite } from "@/hooks/use-bookmarks";
import type { ListBookmarksParams } from "@/services/api";
import { useSettingsStore } from "@/stores/settings-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import type { LucideIcon } from "lucide-react";

const GRID_CLASSES = {
  compact: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  comfortable: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  spacious: "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3",
} as const;

interface BookmarkGridProps {
  params?: ListBookmarksParams;
  /** LucideIcon component, or an icon-registry name (safe to pass from Server Components). */
  emptyIcon?: LucideIcon | string;
  emptyTitle?: string;
  emptyDescription?: string;
  showAddOnEmpty?: boolean;
}

export function BookmarkGrid({
  params = {},
  emptyIcon = Bookmark,
  emptyTitle = "No bookmarks yet",
  emptyDescription = "Save your first bookmark and it will show up here.",
  showAddOnEmpty = true,
}: BookmarkGridProps) {
  const reducedMotion = useReducedMotion();
  const density = useSettingsStore((state) => state.density);
  const selectedIds = useUiStore((state) => state.selectedIds);
  const toggleSelected = useUiStore((state) => state.toggleSelected);
  const selectMany = useUiStore((state) => state.selectMany);
  const clearSelection = useUiStore((state) => state.clearSelection);
  const openAddBookmark = useUiStore((state) => state.openAddBookmark);
  const lastToggledId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBookmarksInfinite(params);

  const bookmarks = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  // Clear stale selection when navigating between filtered views.
  useEffect(() => () => clearSelection(), [clearSelection]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, bookmarks.length]);

  const handleSelectToggle = useCallback(
    (id: string, shiftKey: boolean) => {
      if (shiftKey && lastToggledId.current) {
        const ids = bookmarks.map((bookmark) => bookmark.id);
        const from = ids.indexOf(lastToggledId.current);
        const to = ids.indexOf(id);
        if (from !== -1 && to !== -1) {
          const range = ids.slice(Math.min(from, to), Math.max(from, to) + 1);
          selectMany([...new Set([...selectedIds, ...range])]);
          lastToggledId.current = id;
          return;
        }
      }
      toggleSelected(id);
      lastToggledId.current = id;
    },
    [bookmarks, selectedIds, selectMany, toggleSelected]
  );

  // Arrow-key spatial navigation between cards.
  const handleGridKeyDown = useCallback((event: React.KeyboardEvent) => {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];
    if (!keys.includes(event.key)) return;
    const container = containerRef.current;
    const active = document.activeElement;
    if (!container || !(active instanceof HTMLElement) || !active.dataset.bookmarkId) return;

    event.preventDefault();
    const cards = Array.from(
      container.querySelectorAll<HTMLElement>("[data-bookmark-id]")
    );
    const index = cards.indexOf(active);
    if (index === -1) return;

    if (event.key === "ArrowRight") cards[index + 1]?.focus();
    else if (event.key === "ArrowLeft") cards[index - 1]?.focus();
    else {
      // Jump a full visual row using the card's own geometry.
      const rect = active.getBoundingClientRect();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      let best: { card: HTMLElement; distance: number } | null = null;
      for (const card of cards) {
        if (card === active) continue;
        const other = card.getBoundingClientRect();
        const dy = (other.top - rect.top) * direction;
        if (dy <= 4) continue;
        const distance = dy * dy + Math.abs(other.left - rect.left) ** 2;
        if (!best || distance < best.distance) best = { card, distance };
      }
      best?.card.focus();
    }
  }, []);

  if (isLoading) {
    return <BookmarkGridSkeleton density={density} className={GRID_CLASSES[density]} count={8} />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load bookmarks"
        description={error instanceof Error ? error.message : "Something went wrong."}
        action={
          <Button onClick={() => refetch()} variant="outline">
            <RotateCw /> Try again
          </Button>
        }
      />
    );
  }

  const EmptyIcon = typeof emptyIcon === "string" ? getIcon(emptyIcon) : emptyIcon;

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={EmptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={
          showAddOnEmpty ? (
            <Button onClick={() => openAddBookmark()}>
              <Plus /> Add bookmark
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn(GRID_CLASSES[density])}
        onKeyDown={handleGridKeyDown}
        role="list"
        aria-label="Bookmarks"
      >
        <AnimatePresence mode="popLayout" initial={!reducedMotion}>
          {bookmarks.map((bookmark, index) => (
            <motion.div
              key={bookmark.id}
              role="listitem"
              layout={!reducedMotion}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
                delay: reducedMotion ? 0 : Math.min(index % 24, 12) * 0.03,
              }}
            >
              <BookmarkCard
                bookmark={bookmark}
                density={density}
                selectable
                selected={selectedIds.includes(bookmark.id)}
                onSelectToggle={handleSelectToggle}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasNextPage && (
        <div ref={sentinelRef} className="mt-6">
          {isFetchingNextPage && (
            <BookmarkGridSkeleton density={density} className={GRID_CLASSES[density]} count={4} />
          )}
        </div>
      )}

      <BulkActionBar />
    </>
  );
}
