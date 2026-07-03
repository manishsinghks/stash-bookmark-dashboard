import { z } from "zod";
import { getSettings, apiBase } from "@/services/settings";
import { log } from "@/services/logger";
import type {
  BookmarkDto,
  CategoryDto,
  CollectionDto,
  SaveBookmarkInput,
  TagDto,
} from "@/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    /** true when the dashboard was unreachable (offline / not running). */
    public network = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const saveInputSchema = z.object({
  url: z.url().max(2048),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).nullish(),
  notes: z.string().max(4000).nullish(),
  faviconUrl: z.string().max(2048).nullish(),
  ogImageUrl: z.string().max(2048).nullish(),
  themeColor: z.string().max(32).nullish(),
  categoryId: z.string().nullish(),
  collectionId: z.string().nullish(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);
const MAX_RETRIES = 2;

/**
 * fetch with bounded exponential backoff. Retries network failures and
 * 5xx responses only — 4xx means the request itself is wrong.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const settings = await getSettings();
  const url = `${apiBase(settings)}/api${path}`;

  let lastError: ApiError | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** (attempt - 1)));
    }
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const error = new ApiError(
          body?.error?.message ?? `Request failed (${response.status})`,
          response.status
        );
        if (!RETRYABLE_STATUS.has(response.status)) throw error;
        lastError = error;
        continue;
      }
      return body.data as T;
    } catch (error) {
      if (error instanceof ApiError && !RETRYABLE_STATUS.has(error.status)) throw error;
      lastError =
        error instanceof ApiError
          ? error
          : new ApiError("Dashboard unreachable", 0, true);
    }
  }

  await log("warn", `API request failed after retries: ${path}`, {
    message: lastError?.message,
  });
  throw lastError ?? new ApiError("Request failed", 0, true);
}

export const api = {
  /** Cheap connectivity probe used by the sync engine and options page. */
  async isReachable(): Promise<boolean> {
    try {
      const settings = await getSettings();
      const response = await fetch(`${apiBase(settings)}/api/stats`, {
        method: "GET",
        signal: AbortSignal.timeout(4000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  lookupBookmark(url: string): Promise<BookmarkDto | null> {
    return request<BookmarkDto | null>(
      `/bookmarks/lookup?url=${encodeURIComponent(url)}`
    );
  },

  createBookmark(input: SaveBookmarkInput): Promise<BookmarkDto> {
    return request<BookmarkDto>("/bookmarks", {
      method: "POST",
      body: JSON.stringify(saveInputSchema.parse(input)),
    });
  },

  updateBookmark(id: string, input: Partial<SaveBookmarkInput>): Promise<BookmarkDto> {
    return request<BookmarkDto>(`/bookmarks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(saveInputSchema.partial().parse(input)),
    });
  },

  categories(): Promise<CategoryDto[]> {
    return request<CategoryDto[]>("/categories");
  },

  /** Server-side scrape for URLs the user hasn't visited (link/image saves). */
  metadata(url: string): Promise<{
    title: string | null;
    description: string | null;
    faviconUrl: string | null;
    ogImageUrl: string | null;
    themeColor: string | null;
    domain: string;
  }> {
    return request("/metadata", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  collections(): Promise<CollectionDto[]> {
    return request<CollectionDto[]>("/collections");
  },

  tags(): Promise<TagDto[]> {
    return request<TagDto[]>("/tags");
  },
};
