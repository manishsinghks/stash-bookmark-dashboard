import { z } from "zod";

export const urlSchema = z
  .url({ protocol: /^https?$/, hostname: z.regexes.domain })
  .max(2048);

export const createBookmarkSchema = z.object({
  url: urlSchema,
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(1000).nullish(),
  notes: z.string().trim().max(4000).nullish(),
  faviconUrl: z.string().max(2048).nullish(),
  ogImageUrl: z.string().max(2048).nullish(),
  themeColor: z.string().max(32).nullish(),
  categoryId: z.string().nullish(),
  collectionId: z.string().nullish(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export const updateBookmarkSchema = createBookmarkSchema.partial().extend({
  restore: z.boolean().optional(),
  visitCount: z.number().int().min(0).optional(),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.enum(["delete", "restore", "favorite", "unfavorite", "move", "tag"]),
  collectionId: z.string().nullish(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export const listBookmarksSchema = z.object({
  filter: z.enum(["all", "favorites", "recent"]).default("all"),
  categoryId: z.string().optional(),
  collectionId: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(["newest", "oldest", "alphabetical", "most-visited"]).default("newest"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(24),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  icon: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #8B5CF6"),
});

export const collectionSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(300).nullish(),
  icon: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #8B5CF6"),
});

export const metadataRequestSchema = z.object({
  url: urlSchema,
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type ListBookmarksInput = z.infer<typeof listBookmarksSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
