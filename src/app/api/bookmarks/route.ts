import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";
import { createBookmarkSchema, listBookmarksSchema } from "@/lib/validations";

const bookmarkInclude = {
  category: true,
  collection: true,
  tags: true,
} satisfies Prisma.BookmarkInclude;

const SORT_ORDERS: Record<string, Prisma.BookmarkOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  alphabetical: [{ name: "asc" }, { id: "asc" }],
  "most-visited": [{ visitCount: "desc" }, { id: "desc" }],
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  const params = listBookmarksSchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  );

  const where: Prisma.BookmarkWhereInput = { deletedAt: null };
  if (params.filter === "favorites") where.isFavorite = true;
  if (params.filter === "recent") {
    where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.collectionId) where.collectionId = params.collectionId;
  if (params.tag) where.tags = { some: { name: params.tag } };

  const [items, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      include: bookmarkInclude,
      orderBy: SORT_ORDERS[params.sort],
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    }),
    prisma.bookmark.count({ where }),
  ]);

  const hasMore = items.length > params.limit;
  const page = hasMore ? items.slice(0, params.limit) : items;

  return ok({
    items: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
    total,
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = createBookmarkSchema.parse(await request.json());
  const domain = new URL(input.url).hostname.replace(/^www\./, "");

  const bookmark = await prisma.bookmark.create({
    data: {
      url: input.url,
      name: input.name,
      description: input.description ?? null,
      notes: input.notes ?? null,
      faviconUrl:
        input.faviconUrl ??
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      ogImageUrl: input.ogImageUrl ?? null,
      themeColor: input.themeColor ?? null,
      domain,
      isFavorite: input.isFavorite ?? false,
      categoryId: input.categoryId ?? null,
      collectionId: input.collectionId ?? null,
      tags: {
        connectOrCreate: (input.tags ?? []).map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      activities: { create: { type: "created" } },
    },
    include: bookmarkInclude,
  });

  return ok(bookmark, { status: 201 });
});
