import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";

const importItemSchema = z.object({
  url: z.url().max(2048),
  name: z.string().trim().min(1).max(200).catch("Untitled"),
  description: z.string().max(1000).nullish(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  folder: z.string().max(100).nullish(),
  createdAt: z.string().nullish(),
  isFavorite: z.boolean().optional(),
});

const importSchema = z.object({
  items: z.array(importItemSchema).min(1).max(5000),
  createCollections: z.boolean().default(true),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { items, createCollections } = importSchema.parse(await request.json());

  const existing = await prisma.bookmark.findMany({
    where: { deletedAt: null },
    select: { url: true },
  });
  const existingUrls = new Set(existing.map((bookmark) => bookmark.url));

  // Resolve folders to collections up front (one query per unique folder).
  const collectionIdByName = new Map<string, string>();
  if (createCollections) {
    const folders = [...new Set(items.map((item) => item.folder).filter(Boolean))] as string[];
    for (const folder of folders.slice(0, 50)) {
      const collection = await prisma.collection.upsert({
        where: { name: folder },
        update: {},
        create: { name: folder },
      });
      collectionIdByName.set(folder, collection.id);
    }
  }

  let imported = 0;
  let skipped = 0;
  const seenInBatch = new Set<string>();

  for (const item of items) {
    if (existingUrls.has(item.url) || seenInBatch.has(item.url)) {
      skipped += 1;
      continue;
    }
    seenInBatch.add(item.url);

    const domain = new URL(item.url).hostname.replace(/^www\./, "");
    const createdAt =
      item.createdAt && !Number.isNaN(Date.parse(item.createdAt))
        ? new Date(item.createdAt)
        : undefined;

    await prisma.bookmark.create({
      data: {
        url: item.url,
        name: item.name,
        description: item.description ?? null,
        domain,
        faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        isFavorite: item.isFavorite ?? false,
        collectionId: item.folder ? collectionIdByName.get(item.folder) : undefined,
        createdAt,
        tags: {
          connectOrCreate: (item.tags ?? []).slice(0, 20).map((name) => ({
            where: { name: name.toLowerCase() },
            create: { name: name.toLowerCase() },
          })),
        },
        activities: { create: { type: "created" } },
      },
    });
    imported += 1;
  }

  return ok({ imported, skipped, total: items.length });
});
