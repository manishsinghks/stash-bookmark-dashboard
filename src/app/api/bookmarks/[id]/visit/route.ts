import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(
  async (_request: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    const bookmark = await prisma.bookmark.update({
      where: { id },
      data: {
        visitCount: { increment: 1 },
        lastVisitedAt: new Date(),
        activities: { create: { type: "visited" } },
      },
      select: { id: true, visitCount: true, lastVisitedAt: true },
    });
    return ok(bookmark);
  }
);
