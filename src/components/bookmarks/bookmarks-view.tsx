"use client";

import { useState } from "react";
import { ArrowUpDown, ListFilter, Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookmarkGrid } from "@/components/bookmarks/bookmark-grid";
import { getIcon } from "@/lib/icons";
import { useCategories, useTags } from "@/hooks/use-taxonomies";
import { useSettingsStore, type SortOption } from "@/stores/settings-store";
import type { ListBookmarksParams } from "@/services/api";
import type { LucideIcon } from "lucide-react";

const ALL = "__all__";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  alphabetical: "A to Z",
  "most-visited": "Most visited",
};

interface BookmarksViewProps {
  baseParams?: ListBookmarksParams;
  emptyIcon?: LucideIcon | string;
  emptyTitle?: string;
  emptyDescription?: string;
  showCategoryFilter?: boolean;
  showTagFilter?: boolean;
}

/**
 * FilterBar + BookmarkGrid pairing shared by All Bookmarks, Favorites,
 * Recent, and collection detail pages.
 */
export function BookmarksView({
  baseParams = {},
  emptyIcon,
  emptyTitle,
  emptyDescription,
  showCategoryFilter = true,
  showTagFilter = true,
}: BookmarksViewProps) {
  const defaultSort = useSettingsStore((state) => state.defaultSort);
  const [sort, setSort] = useState<SortOption>(defaultSort);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [tag, setTag] = useState<string>(ALL);
  const { data: categories } = useCategories();
  const { data: tags } = useTags();

  const hasFilters = categoryId !== ALL || tag !== ALL;

  const params: ListBookmarksParams = {
    ...baseParams,
    sort,
    ...(categoryId !== ALL ? { categoryId } : {}),
    ...(tag !== ALL ? { tag } : {}),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        <Select value={sort} onValueChange={(next) => setSort(next as SortOption)}>
          <SelectTrigger size="sm" className="w-auto gap-1.5" aria-label="Sort order">
            <ArrowUpDown className="size-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showCategoryFilter && (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger size="sm" className="w-auto gap-1.5" aria-label="Filter by category">
              <ListFilter className="size-3.5" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories?.map((category) => {
                const Icon = getIcon(category.icon);
                return (
                  <SelectItem key={category.id} value={category.id}>
                    <Icon className="size-4" style={{ color: category.color }} />
                    {category.name}
                    <span className="text-muted-foreground tabular-nums">({category.count})</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}

        {showTagFilter && (
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger size="sm" className="w-auto gap-1.5" aria-label="Filter by tag">
              <TagIcon className="size-3.5" />
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All tags</SelectItem>
              {tags?.map((tagItem) => (
                <SelectItem key={tagItem.id} value={tagItem.name}>
                  {tagItem.name}
                  <span className="text-muted-foreground tabular-nums">({tagItem.count})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryId(ALL);
              setTag(ALL);
            }}
          >
            <X /> Clear filters
          </Button>
        )}
      </div>

      <BookmarkGrid
        params={params}
        emptyIcon={emptyIcon}
        emptyTitle={hasFilters ? "Nothing matches these filters" : emptyTitle}
        emptyDescription={
          hasFilters
            ? "Try removing a filter or searching instead."
            : emptyDescription
        }
        showAddOnEmpty={!hasFilters}
      />
    </div>
  );
}
