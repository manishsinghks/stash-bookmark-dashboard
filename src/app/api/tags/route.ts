import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";

export const GET = withErrorHandling(async () => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { bookmarks: { where: { deletedAt: null } } } },
    },
  });
  return ok(
    tags
      .map(({ _count, ...tag }) => ({ ...tag, count: _count.bookmarks }))
      .filter((tag) => tag.count > 0)
  );
});
