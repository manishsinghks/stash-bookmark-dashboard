import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";
import type { ActivityPoint } from "@/types";

const DAY = 24 * 60 * 60 * 1000;

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildSeries(days: number, countsByDay: Map<string, number>): ActivityPoint[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today.getTime() - (days - 1 - i) * DAY);
    const key = toDayKey(date);
    return { date: key, count: countsByDay.get(key) ?? 0 };
  });
}

export const GET = withErrorHandling(async () => {
  const monthAgo = new Date(Date.now() - 30 * DAY);

  const [
    total,
    favorites,
    categoryCount,
    collectionCount,
    tagCount,
    mostVisited,
    recentlyOpened,
    tags,
    categories,
    activities,
  ] = await Promise.all([
    prisma.bookmark.count({ where: { deletedAt: null } }),
    prisma.bookmark.count({ where: { deletedAt: null, isFavorite: true } }),
    prisma.category.count(),
    prisma.collection.count(),
    prisma.tag.count({ where: { bookmarks: { some: { deletedAt: null } } } }),
    prisma.bookmark.findMany({
      where: { deletedAt: null, visitCount: { gt: 0 } },
      orderBy: { visitCount: "desc" },
      take: 8,
      include: { category: true, collection: true, tags: true },
    }),
    prisma.bookmark.findMany({
      where: { deletedAt: null, lastVisitedAt: { not: null } },
      orderBy: { lastVisitedAt: "desc" },
      take: 8,
      include: { category: true, collection: true, tags: true },
    }),
    prisma.tag.findMany({
      include: {
        _count: { select: { bookmarks: { where: { deletedAt: null } } } },
      },
    }),
    prisma.category.findMany({
      include: {
        _count: { select: { bookmarks: { where: { deletedAt: null } } } },
      },
    }),
    prisma.activity.findMany({
      where: { createdAt: { gte: monthAgo } },
      select: { createdAt: true },
    }),
  ]);

  const countsByDay = new Map<string, number>();
  for (const activity of activities) {
    const key = toDayKey(activity.createdAt);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const topTags = tags
    .map((tag) => ({ name: tag.name, count: tag._count.bookmarks }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const categoryBreakdown = categories
    .map((category) => ({
      name: category.name,
      color: category.color,
      count: category._count.bookmarks,
    }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count);

  return ok({
    totals: {
      total,
      favorites,
      categories: categoryCount,
      collections: collectionCount,
      tags: tagCount,
    },
    mostVisited,
    recentlyOpened,
    topTags,
    categoryBreakdown,
    weekly: buildSeries(7, countsByDay),
    monthly: buildSeries(30, countsByDay),
  });
});
