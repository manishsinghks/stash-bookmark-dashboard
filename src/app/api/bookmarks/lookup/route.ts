import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, ok, withErrorHandling } from "@/lib/api-utils";

/**
 * Duplicate detection for the browser extension: exact-match a URL
 * (tolerating a trailing-slash difference) against non-deleted
 * bookmarks. Returns the bookmark or null.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return fail("Missing ?url parameter.", 422);

  const variants = new Set([url]);
  if (url.endsWith("/")) variants.add(url.slice(0, -1));
  else variants.add(`${url}/`);

  const bookmark = await prisma.bookmark.findFirst({
    where: { deletedAt: null, url: { in: [...variants] } },
    include: { category: true, collection: true, tags: true },
  });

  return ok(bookmark ?? null);
});
