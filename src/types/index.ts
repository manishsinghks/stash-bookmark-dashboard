/**
 * DTO types mirror the Prisma models but with JSON-serialized dates
 * (strings), since these are the shapes that cross the API boundary.
 */

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  isCustom: boolean;
  createdAt: string;
}

export interface CollectionDto {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sortOrder: number;
  createdAt: string;
}

export interface TagDto {
  id: string;
  name: string;
  createdAt: string;
}

export interface BookmarkDto {
  id: string;
  url: string;
  name: string;
  description: string | null;
  notes: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  themeColor: string | null;
  domain: string;
  isFavorite: boolean;
  visitCount: number;
  lastVisitedAt: string | null;
  deletedAt: string | null;
  categoryId: string | null;
  collectionId: string | null;
  category: CategoryDto | null;
  collection: CollectionDto | null;
  tags: TagDto[];
  createdAt: string;
  updatedAt: string;
}

export type WithCount<T> = T & { count: number };

export interface BookmarkListResponse {
  items: BookmarkDto[];
  nextCursor: string | null;
  total: number;
}

export interface StatsResponse {
  total: number;
  favorites: number;
  categories: number;
  collections: number;
  tags: number;
}

export interface UrlMetadata {
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  themeColor: string | null;
  domain: string;
}

export interface ActivityPoint {
  date: string;
  count: number;
}

export interface AnalyticsResponse {
  totals: StatsResponse;
  mostVisited: BookmarkDto[];
  recentlyOpened: BookmarkDto[];
  topTags: Array<{ name: string; count: number }>;
  categoryBreakdown: Array<{ name: string; color: string; count: number }>;
  weekly: ActivityPoint[];
  monthly: ActivityPoint[];
}

export type BookmarkFilter = "all" | "favorites" | "recent";
export type BulkAction = "delete" | "restore" | "favorite" | "unfavorite" | "move" | "tag";
