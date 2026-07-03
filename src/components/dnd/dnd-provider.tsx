"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Favicon } from "@/components/bookmarks/favicon";
import { useUpdateBookmark } from "@/hooks/use-bookmarks";
import type { BookmarkDto } from "@/types";

/**
 * App-wide drag context: bookmark cards are draggable, sidebar
 * collections are drop targets. An 8px activation distance keeps
 * ordinary clicks from starting accidental drags.
 */
export function DndProvider({ children }: { children: ReactNode }) {
  const [dragged, setDragged] = useState<BookmarkDto | null>(null);
  const updateBookmark = useUpdateBookmark();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const bookmark = event.active.data.current?.bookmark as BookmarkDto | undefined;
    setDragged(bookmark ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const bookmark = event.active.data.current?.bookmark as BookmarkDto | undefined;
    const collection = event.over?.data.current as
      | { collectionId: string; collectionName: string }
      | undefined;
    setDragged(null);

    if (!bookmark || !collection) return;
    if (bookmark.collectionId === collection.collectionId) return;

    updateBookmark.mutate(
      { id: bookmark.id, input: { collectionId: collection.collectionId } },
      {
        onSuccess: () =>
          toast.success(`Moved to ${collection.collectionName}`, {
            description: bookmark.name,
          }),
      }
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragged(null)}
    >
      {children}
      <DragOverlay dropAnimation={{ duration: 180 }}>
        {dragged && (
          <div className="glass flex w-56 items-center gap-2.5 rounded-xl border p-3 shadow-lifted">
            <Favicon src={dragged.faviconUrl} className="size-6 shrink-0 p-0.5" />
            <span className="truncate text-sm font-medium">{dragged.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
