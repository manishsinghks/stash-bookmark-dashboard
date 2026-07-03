import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";

export const GET = withErrorHandling(async () => {
  const [total, favorites, categories, collections, tags] = await Promise.all([
    prisma.bookmark.count({ where: { deletedAt: null } }),
    prisma.bookmark.count({ where: { deletedAt: null, isFavorite: true } }),
    prisma.category.count(),
    prisma.collection.count(),
    prisma.tag.count({ where: { bookmarks: { some: { deletedAt: null } } } }),
  ]);
  return ok({ total, favorites, categories, collections, tags });
});
