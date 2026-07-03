import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";
import { categorySchema } from "@/lib/validations";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const GET = withErrorHandling(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { bookmarks: { where: { deletedAt: null } } } },
    },
  });
  return ok(
    categories.map(({ _count, ...category }) => ({
      ...category,
      count: _count.bookmarks,
    }))
  );
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = categorySchema.parse(await request.json());
  const category = await prisma.category.create({
    data: { ...input, slug: slugify(input.name), isCustom: true },
  });
  return ok({ ...category, count: 0 }, { status: 201 });
});
