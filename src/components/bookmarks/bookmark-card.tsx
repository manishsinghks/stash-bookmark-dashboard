"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { motion, useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import { ExternalLink, MousePointerClick, Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Favicon } from "@/components/bookmarks/favicon";
import { BookmarkContextMenu } from "@/components/bookmarks/bookmark-context-menu";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  useDeleteBookmark,
  useToggleFavorite,
  useVisitBookmark,
} from "@/hooks/use-bookmarks";
import { useUiStore } from "@/stores/ui-store";
import type { Density } from "@/stores/settings-store";
import type { BookmarkDto } from "@/types";

interface BookmarkCardProps {
  bookmark: BookmarkDto;
  density?: Density;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: (id: string, shiftKey: boolean) => void;
}

function BookmarkCardInner({
  bookmark,
  density = "comfortable",
  selectable = false,
  selected = false,
  onSelectToggle,
}: BookmarkCardProps) {
  const reducedMotion = useReducedMotion();
  // Pointer-only dragging: keyboard users move bookmarks via the
  // context menu's "Move to collection", so we skip dnd-kit's
  // role/tabIndex attributes to preserve the card's own semantics.
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: bookmark.id,
    data: { bookmark },
  });
  const toggleFavorite = useToggleFavorite();
  const deleteBookmark = useDeleteBookmark();
  const visitBookmark = useVisitBookmark();
  const openEditBookmark = useUiStore((state) => state.openEditBookmark);
  const selectionActive = useUiStore((state) => state.selectedIds.length > 0);

  const showImage = density === "spacious" && Boolean(bookmark.ogImageUrl);
  const showDescription = density !== "compact";

  const open = () => {
    visitBookmark.mutate(bookmark.id);
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  };

  const handleCardClick = (event: React.MouseEvent) => {
    if (selectionActive || event.metaKey || event.ctrlKey) {
      onSelectToggle?.(bookmark.id, event.shiftKey);
      return;
    }
    open();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      open();
    } else if (event.key.toLowerCase() === "e") {
      event.preventDefault();
      openEditBookmark(bookmark);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteBookmark.mutate(bookmark);
    } else if (event.key === " ") {
      event.preventDefault();
      onSelectToggle?.(bookmark.id, event.shiftKey);
    }
  };

  const CategoryIcon = bookmark.category ? getIcon(bookmark.category.icon) : null;
  const visibleTags = bookmark.tags.slice(0, 3);
  const extraTags = bookmark.tags.length - visibleTags.length;

  return (
    <BookmarkContextMenu bookmark={bookmark}>
      <motion.article
        ref={setNodeRef}
        layout={!reducedMotion}
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        data-bookmark-id={bookmark.id}
        tabIndex={0}
        role="link"
        aria-label={`${bookmark.name} — ${bookmark.domain}`}
        {...listeners}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-soft transition-shadow",
          "hover:shadow-lifted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          selected && "border-primary/60 ring-2 ring-primary/30",
          isDragging && "opacity-40"
        )}
      >
        {showImage && (
          <div className="relative h-32 shrink-0 overflow-hidden border-b bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bookmark.ogImageUrl!}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        )}

        <div className={cn("flex flex-1 flex-col", density === "compact" ? "gap-2 p-3" : "gap-2.5 p-4")}>
          <div className="flex items-start gap-2.5">
            {(selectable || selectionActive) && (
              <span
                className={cn(
                  "mt-0.5 transition-opacity",
                  selected || selectionActive
                    ? "opacity-100"
                    : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onSelectToggle?.(bookmark.id, false)}
                  aria-label={`Select ${bookmark.name}`}
                />
              </span>
            )}
            <Favicon src={bookmark.faviconUrl} className="mt-0.5 size-8 shrink-0 p-1" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium">{bookmark.name}</h3>
              <p className="truncate text-xs text-muted-foreground">{bookmark.domain}</p>
            </div>
            <motion.button
              type="button"
              aria-label={bookmark.isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={bookmark.isFavorite}
              whileTap={reducedMotion ? undefined : { scale: 1.35 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              onClick={(event) => {
                event.stopPropagation();
                toggleFavorite.mutate({ id: bookmark.id, isFavorite: !bookmark.isFavorite });
              }}
              className={cn(
                "cursor-pointer rounded-md p-1.5 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                bookmark.isFavorite
                  ? "text-amber-500"
                  : "text-muted-foreground/40 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:text-amber-500"
              )}
            >
              <Star className={cn("size-4", bookmark.isFavorite && "fill-current")} />
            </motion.button>
          </div>

          {showDescription && bookmark.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {bookmark.description}
            </p>
          )}

          {(bookmark.category || visibleTags.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {bookmark.category && CategoryIcon && (
                <Badge
                  variant="outline"
                  className="gap-1 border-transparent text-xs font-medium"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${bookmark.category.color} 12%, transparent)`,
                    color: bookmark.category.color,
                  }}
                >
                  <CategoryIcon className="size-3" />
                  {bookmark.category.name}
                </Badge>
              )}
              {visibleTags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs font-normal">
                  {tag.name}
                </Badge>
              ))}
              {extraTags > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  +{extraTags}
                </Badge>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <time dateTime={bookmark.createdAt}>
              {format(new Date(bookmark.createdAt), "MMM d, yyyy")}
            </time>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1 tabular-nums">
              <MousePointerClick className="size-3" aria-hidden />
              {bookmark.visitCount}
              <span className="sr-only">visits</span>
            </span>

            <span
              className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
              onClick={(event) => event.stopPropagation()}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Open link" onClick={open}>
                    <ExternalLink />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit bookmark"
                    onClick={() => openEditBookmark(bookmark)}
                  >
                    <Pencil />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete bookmark"
                    className="hover:text-destructive"
                    onClick={() => deleteBookmark.mutate(bookmark)}
                  >
                    <Trash2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </span>
          </div>
        </div>
      </motion.article>
    </BookmarkContextMenu>
  );
}

export const BookmarkCard = memo(BookmarkCardInner);
