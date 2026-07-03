import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, ok, withErrorHandling } from "@/lib/api-utils";
import { updateBookmarkSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

const bookmarkInclude = {
  category: true,
  collection: true,
  tags: true,
} satisfies Prisma.BookmarkInclude;

export const GET = withErrorHandling(
  async (_request: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
      include: bookmarkInclude,
    });
    if (!bookmark) return fail("Bookmark not found.", 404);
    return ok(bookmark);
  }
);

export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    const input = updateBookmarkSchema.parse(await request.json());

    const data: Prisma.BookmarkUpdateInput = {};
    if (input.url !== undefined) {
      data.url = input.url;
      data.domain = new URL(input.url).hostname.replace(/^www\./, "");
    }
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.faviconUrl !== undefined) data.faviconUrl = input.faviconUrl;
    if (input.ogImageUrl !== undefined) data.ogImageUrl = input.ogImageUrl;
    if (input.themeColor !== undefined) data.themeColor = input.themeColor;
    if (input.categoryId !== undefined)
      data.category = input.categoryId
        ? { connect: { id: input.categoryId } }
        : { disconnect: true };
    if (input.collectionId !== undefined)
      data.collection = input.collectionId
        ? { connect: { id: input.collectionId } }
        : { disconnect: true };
    if (input.isFavorite !== undefined) {
      data.isFavorite = input.isFavorite;
      if (input.isFavorite) {
        data.activities = { create: { type: "favorited" } };
      }
    }
    if (input.tags !== undefined) {
      data.tags = {
        set: [],
        connectOrCreate: input.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      };
    }
    if (input.restore) data.deletedAt = null;

    const bookmark = await prisma.bookmark.update({
      where: { id },
      data,
      include: bookmarkInclude,
    });

    return ok(bookmark);
  }
);

export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";

    if (permanent) {
      await prisma.bookmark.delete({ where: { id } });
      return ok({ id, permanent: true });
    }

    await prisma.bookmark.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        activities: { create: { type: "deleted" } },
      },
    });
    return ok({ id, permanent: false });
  }
);
