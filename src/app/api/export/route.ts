import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, withErrorHandling } from "@/lib/api-utils";
import { EXPORTERS, type ExportFormat } from "@/lib/exporters";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const format = (request.nextUrl.searchParams.get("format") ?? "json") as ExportFormat;
  const exporter = EXPORTERS[format];
  if (!exporter) {
    return fail(`Unsupported format. Use one of: ${Object.keys(EXPORTERS).join(", ")}`, 422);
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { deletedAt: null },
    include: { category: true, collection: true, tags: true },
    orderBy: { createdAt: "desc" },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(exporter.serialize(bookmarks), {
    headers: {
      "Content-Type": `${exporter.mime}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="stash-bookmarks-${date}.${exporter.extension}"`,
    },
  });
});
