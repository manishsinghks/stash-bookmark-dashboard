"use client";

import type { ReactNode } from "react";
import {
  Copy,
  ExternalLink,
  EyeOff,
  Files,
  FolderInput,
  Pencil,
  Share2,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { getIcon } from "@/lib/icons";
import { useCollections } from "@/hooks/use-taxonomies";
import {
  useCreateBookmark,
  useDeleteBookmark,
  useToggleFavorite,
  useUpdateBookmark,
  useVisitBookmark,
} from "@/hooks/use-bookmarks";
import { useUiStore } from "@/stores/ui-store";
import type { BookmarkDto } from "@/types";

export function BookmarkContextMenu({
  bookmark,
  children,
}: {
  bookmark: BookmarkDto;
  children: ReactNode;
}) {
  const { data: collections } = useCollections();
  const toggleFavorite = useToggleFavorite();
  const deleteBookmark = useDeleteBookmark();
  const updateBookmark = useUpdateBookmark();
  const createBookmark = useCreateBookmark();
  const visitBookmark = useVisitBookmark();
  const openEditBookmark = useUiStore((state) => state.openEditBookmark);

  const openBookmark = () => {
    visitBookmark.mutate(bookmark.id);
    window.open(bookmark.url, "_blank", "noopener,noreferrer");
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(bookmark.url);
    toast.success("URL copied to clipboard");
  };

  const copyForIncognito = async () => {
    await navigator.clipboard.writeText(bookmark.url);
    toast("URL copied for private browsing", {
      description: "Open a private window (⇧⌘N in Chrome, ⌘N in Safari) and paste.",
    });
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: bookmark.name,
          text: bookmark.description ?? undefined,
          url: bookmark.url,
        });
      } catch {
        // User dismissed the share sheet — nothing to do.
      }
    } else {
      await copyUrl();
    }
  };

  const duplicate = () => {
    createBookmark.mutate({
      url: bookmark.url,
      name: `${bookmark.name} (copy)`,
      description: bookmark.description,
      notes: bookmark.notes,
      faviconUrl: bookmark.faviconUrl,
      ogImageUrl: bookmark.ogImageUrl,
      themeColor: bookmark.themeColor,
      categoryId: bookmark.categoryId,
      collectionId: bookmark.collectionId,
      tags: bookmark.tags.map((tag) => tag.name),
    });
  };

  const moveToCollection = (collectionId: string | null) => {
    updateBookmark.mutate(
      { id: bookmark.id, input: { collectionId } },
      { onSuccess: () => toast.success("Bookmark moved") }
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={openBookmark}>
          <ExternalLink /> Open
          <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={copyForIncognito}>
          <EyeOff /> Open in Incognito
        </ContextMenuItem>
        <ContextMenuItem onClick={copyUrl}>
          <Copy /> Copy URL
        </ContextMenuItem>
        <ContextMenuItem onClick={share}>
          <Share2 /> Share
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() =>
            toggleFavorite.mutate({ id: bookmark.id, isFavorite: !bookmark.isFavorite })
          }
        >
          {bookmark.isFavorite ? (
            <>
              <StarOff /> Remove favorite
            </>
          ) : (
            <>
              <Star /> Add to favorites
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => openEditBookmark(bookmark)}>
          <Pencil /> Edit
          <ContextMenuShortcut>E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={duplicate}>
          <Files /> Duplicate
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="mr-2 size-4" /> Move to collection
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {collections?.map((collection) => {
              const Icon = getIcon(collection.icon);
              return (
                <ContextMenuItem
                  key={collection.id}
                  disabled={collection.id === bookmark.collectionId}
                  onClick={() => moveToCollection(collection.id)}
                >
                  <Icon style={{ color: collection.color }} />
                  {collection.name}
                </ContextMenuItem>
              );
            })}
            {bookmark.collectionId && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => moveToCollection(null)}>
                  Remove from collection
                </ContextMenuItem>
              </>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={() => deleteBookmark.mutate(bookmark)}>
          <Trash2 /> Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
