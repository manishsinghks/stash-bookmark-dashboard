/** DTO shapes mirrored from the dashboard API (dates are ISO strings). */

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  isCustom: boolean;
  count?: number;
}

export interface CollectionDto {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  count?: number;
}

export interface TagDto {
  id: string;
  name: string;
  count?: number;
}

export interface BookmarkDto {
  id: string;
  url: string;
  name: string;
  description: string | null;
  notes: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  domain: string;
  isFavorite: boolean;
  visitCount: number;
  categoryId: string | null;
  collectionId: string | null;
  tags: TagDto[];
  createdAt: string;
  updatedAt: string;
}

/** What the extension sends to POST/PATCH /api/bookmarks. */
export interface SaveBookmarkInput {
  url: string;
  name: string;
  description?: string | null;
  notes?: string | null;
  faviconUrl?: string | null;
  ogImageUrl?: string | null;
  themeColor?: string | null;
  categoryId?: string | null;
  collectionId?: string | null;
  isFavorite?: boolean;
  tags?: string[];
}

/** Extracted in-page via chrome.scripting (see content/metadata-extractor). */
export interface PageMetadata {
  url: string;
  title: string;
  description: string | null;
  ogImageUrl: string | null;
  themeColor: string | null;
  faviconUrl: string | null;
  selectionText?: string | null;
}

export interface QueuedBookmark {
  id: string;
  input: SaveBookmarkInput;
  queuedAt: string;
  attempts: number;
  lastError?: string;
}

export interface LogEntry {
  time: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: unknown;
}
