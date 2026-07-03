import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, withErrorHandling } from "@/lib/api-utils";
import { bulkActionSchema } from "@/lib/validations";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = bulkActionSchema.parse(await request.json());
  const { ids, action } = input;

  switch (action) {
    case "delete": {
      const now = new Date();
      await prisma.$transaction([
        prisma.bookmark.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: now },
        }),
        prisma.activity.createMany({
          data: ids.map((bookmarkId) => ({ type: "deleted", bookmarkId })),
        }),
      ]);
      break;
    }
    case "restore":
      await prisma.bookmark.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: null },
      });
      break;
    case "favorite":
    case "unfavorite":
      await prisma.bookmark.updateMany({
        where: { id: { in: ids } },
        data: { isFavorite: action === "favorite" },
      });
      break;
    case "move":
      await prisma.bookmark.updateMany({
        where: { id: { in: ids } },
        data: { collectionId: input.collectionId ?? null },
      });
      break;
    case "tag": {
      if (!input.tags?.length) return fail("No tags provided.", 422);
      const connectOrCreate = input.tags.map((name) => ({
        where: { name },
        create: { name },
      }));
      await prisma.$transaction(
        ids.map((id) =>
          prisma.bookmark.update({
            where: { id },
            data: { tags: { connectOrCreate } },
          })
        )
      );
      break;
    }
  }

  return ok({ ids, action });
});
