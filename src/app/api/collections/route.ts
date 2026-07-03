import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";
import { collectionSchema } from "@/lib/validations";

export const GET = withErrorHandling(async () => {
  const collections = await prisma.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { bookmarks: { where: { deletedAt: null } } } },
    },
  });
  return ok(
    collections.map(({ _count, ...collection }) => ({
      ...collection,
      count: _count.bookmarks,
    }))
  );
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = collectionSchema.parse(await request.json());
  const last = await prisma.collection.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const collection = await prisma.collection.create({
    data: { ...input, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  return ok({ ...collection, count: 0 }, { status: 201 });
});
