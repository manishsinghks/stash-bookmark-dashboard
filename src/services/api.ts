import type {
  AnalyticsResponse,
  BookmarkDto,
  BookmarkListResponse,
  CategoryDto,
  CollectionDto,
  StatsResponse,
  TagDto,
  UrlMetadata,
  WithCount,
} from "@/types";
import type {
  BulkActionInput,
  CategoryInput,
  CollectionInput,
  CreateBookmarkInput,
  UpdateBookmarkInput,
} from "@/lib/validations";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? `Request failed (${response.status})`,
      response.status
    );
  }
  return body.data as T;
}

export interface ListBookmarksParams {
  filter?: "all" | "favorites" | "recent";
  categoryId?: string;
  collectionId?: string;
  tag?: string;
  sort?: "newest" | "oldest" | "alphabetical" | "most-visited";
  cursor?: string;
  limit?: number;
}

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  bookmarks: {
    list: (params: ListBookmarksParams = {}) =>
      request<BookmarkListResponse>(`/bookmarks${toQuery({ ...params })}`),
    get: (id: string) => request<BookmarkDto>(`/bookmarks/${id}`),
    create: (input: CreateBookmarkInput) =>
      request<BookmarkDto>("/bookmarks", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: UpdateBookmarkInput) =>
      request<BookmarkDto>(`/bookmarks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (id: string, permanent = false) =>
      request<{ id: string }>(
        `/bookmarks/${id}${permanent ? "?permanent=true" : ""}`,
        { method: "DELETE" }
      ),
    visit: (id: string) =>
      request<{ id: string; visitCount: number }>(`/bookmarks/${id}/visit`, {
        method: "POST",
      }),
    bulk: (input: BulkActionInput) =>
      request<{ ids: string[]; action: string }>("/bookmarks/bulk", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  categories: {
    list: () => request<WithCount<CategoryDto>[]>("/categories"),
    create: (input: CategoryInput) =>
      request<WithCount<CategoryDto>>("/categories", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: Partial<CategoryInput>) =>
      request<CategoryDto>(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<{ id: string }>(`/categories/${id}`, { method: "DELETE" }),
  },
  collections: {
    list: () => request<WithCount<CollectionDto>[]>("/collections"),
    create: (input: CollectionInput) =>
      request<WithCount<CollectionDto>>("/collections", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: Partial<CollectionInput>) =>
      request<CollectionDto>(`/collections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<{ id: string }>(`/collections/${id}`, { method: "DELETE" }),
  },
  tags: {
    list: () => request<WithCount<TagDto>[]>("/tags"),
  },
  stats: () => request<StatsResponse>("/stats"),
  analytics: () => request<AnalyticsResponse>("/analytics"),
  metadata: (url: string) =>
    request<UrlMetadata>("/metadata", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
};
