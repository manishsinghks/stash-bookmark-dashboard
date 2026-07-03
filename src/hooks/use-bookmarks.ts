"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type ListBookmarksParams } from "@/services/api";
import type { BookmarkDto, BookmarkListResponse } from "@/types";
import type {
  BulkActionInput,
  CreateBookmarkInput,
  UpdateBookmarkInput,
} from "@/lib/validations";

export const bookmarkKeys = {
  all: ["bookmarks"] as const,
  list: (params: ListBookmarksParams) => ["bookmarks", "list", params] as const,
  searchIndex: ["bookmarks", "search-index"] as const,
};

const RELATED_KEYS = [["stats"], ["categories"], ["collections"], ["tags"], ["analytics"]];

function useInvalidateBookmarkData() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
    for (const key of RELATED_KEYS) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

export function useBookmarksInfinite(params: ListBookmarksParams = {}) {
  return useInfiniteQuery({
    queryKey: bookmarkKeys.list(params),
    queryFn: ({ pageParam }) =>
      api.bookmarks.list({ ...params, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

/** Full bookmark list used to power the Fuse.js search index. */
export function useSearchIndex() {
  return useQuery({
    queryKey: bookmarkKeys.searchIndex,
    queryFn: () => api.bookmarks.list({ limit: 1000 }),
    select: (data) => data.items,
    staleTime: 30 * 1000,
  });
}

type BookmarkPages = InfiniteData<BookmarkListResponse>;

/** Applies `update` to every cached bookmark list page (all filters/sorts). */
function patchCachedBookmark(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  update: (bookmark: BookmarkDto) => BookmarkDto
) {
  queryClient.setQueriesData<BookmarkPages>(
    { queryKey: bookmarkKeys.all },
    (data) => {
      if (!data?.pages) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === id ? update(item) : item)),
        })),
      };
    }
  );
}

function removeCachedBookmarks(
  queryClient: ReturnType<typeof useQueryClient>,
  ids: string[]
) {
  const idSet = new Set(ids);
  queryClient.setQueriesData<BookmarkPages>(
    { queryKey: bookmarkKeys.all },
    (data) => {
      if (!data?.pages) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => !idSet.has(item.id)),
          total: Math.max(0, page.total - ids.length),
        })),
      };
    }
  );
}

export function useCreateBookmark() {
  const invalidate = useInvalidateBookmarkData();
  return useMutation({
    mutationFn: (input: CreateBookmarkInput) => api.bookmarks.create(input),
    onSuccess: (bookmark) => {
      invalidate();
      toast.success("Bookmark added", { description: bookmark.name });
    },
    onError: (error) => toast.error("Couldn't add bookmark", { description: error.message }),
  });
}

export function useUpdateBookmark() {
  const invalidate = useInvalidateBookmarkData();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBookmarkInput }) =>
      api.bookmarks.update(id, input),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error("Couldn't save changes", { description: error.message }),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateBookmarkData();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      api.bookmarks.update(id, { isFavorite }),
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: bookmarkKeys.all });
      patchCachedBookmark(queryClient, id, (bookmark) => ({ ...bookmark, isFavorite }));
    },
    onError: (error, { id, isFavorite }) => {
      patchCachedBookmark(queryClient, id, (bookmark) => ({
        ...bookmark,
        isFavorite: !isFavorite,
      }));
      toast.error("Couldn't update favorite", { description: error.message });
    },
    onSettled: () => invalidate(),
  });
}

/** Soft-deletes with an undo toast; permanent purge only if undo expires unused. */
export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateBookmarkData();
  return useMutation({
    mutationFn: (bookmark: BookmarkDto) => api.bookmarks.remove(bookmark.id),
    onMutate: async (bookmark) => {
      await queryClient.cancelQueries({ queryKey: bookmarkKeys.all });
      removeCachedBookmarks(queryClient, [bookmark.id]);
    },
    onSuccess: (_data, bookmark) => {
      invalidate();
      toast("Bookmark deleted", {
        description: bookmark.name,
        action: {
          label: "Undo",
          onClick: async () => {
            await api.bookmarks.update(bookmark.id, { restore: true });
            invalidate();
            toast.success("Bookmark restored");
          },
        },
      });
    },
    onError: (error) => {
      invalidate();
      toast.error("Couldn't delete bookmark", { description: error.message });
    },
  });
}

export function useVisitBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.bookmarks.visit(id),
    onMutate: async (id) => {
      patchCachedBookmark(queryClient, id, (bookmark) => ({
        ...bookmark,
        visitCount: bookmark.visitCount + 1,
        lastVisitedAt: new Date().toISOString(),
      }));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useBulkAction() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateBookmarkData();
  return useMutation({
    mutationFn: (input: BulkActionInput) => api.bookmarks.bulk(input),
    onMutate: async (input) => {
      if (input.action === "delete") {
        await queryClient.cancelQueries({ queryKey: bookmarkKeys.all });
        removeCachedBookmarks(queryClient, input.ids);
      }
    },
    onSuccess: (_data, input) => {
      invalidate();
      const n = input.ids.length;
      const messages: Record<BulkActionInput["action"], string> = {
        delete: `Deleted ${n} bookmark${n > 1 ? "s" : ""}`,
        restore: `Restored ${n} bookmark${n > 1 ? "s" : ""}`,
        favorite: `Added ${n} to favorites`,
        unfavorite: `Removed ${n} from favorites`,
        move: `Moved ${n} bookmark${n > 1 ? "s" : ""}`,
        tag: `Tagged ${n} bookmark${n > 1 ? "s" : ""}`,
      };
      if (input.action === "delete") {
        toast(messages.delete, {
          action: {
            label: "Undo",
            onClick: async () => {
              await api.bookmarks.bulk({ ids: input.ids, action: "restore" });
              invalidate();
              toast.success("Bookmarks restored");
            },
          },
        });
      } else {
        toast.success(messages[input.action]);
      }
    },
    onError: (error) => {
      invalidate();
      toast.error("Bulk action failed", { description: error.message });
    },
  });
}
