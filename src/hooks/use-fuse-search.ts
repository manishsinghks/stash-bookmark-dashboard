"use client";

import { useMemo } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";
import { useSearchIndex } from "@/hooks/use-bookmarks";
import type { BookmarkDto } from "@/types";

const FUSE_OPTIONS: IFuseOptions<BookmarkDto> = {
  keys: [
    { name: "name", weight: 2 },
    { name: "domain", weight: 1.5 },
    { name: "url", weight: 1 },
    { name: "description", weight: 1 },
    { name: "notes", weight: 0.8 },
    { name: "tags.name", weight: 1.2 },
    { name: "category.name", weight: 1 },
    { name: "collection.name", weight: 1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  includeScore: true,
};

export function useFuseSearch(query: string, limit = 12) {
  const { data: bookmarks, isLoading } = useSearchIndex();

  const fuse = useMemo(
    () => new Fuse(bookmarks ?? [], FUSE_OPTIONS),
    [bookmarks]
  );

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return fuse.search(trimmed, { limit }).map((result) => result.item);
  }, [fuse, query, limit]);

  return { results, isLoading, indexed: bookmarks?.length ?? 0 };
}
