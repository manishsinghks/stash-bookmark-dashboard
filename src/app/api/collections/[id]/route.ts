import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";
import { collectionSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    const input = collectionSchema.partial().parse(await request.json());
    const collection = await prisma.collection.update({ where: { id }, data: input });
    return ok(collection);
  }
);

export const DELETE = withErrorHandling(
  async (_request: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    await prisma.collection.delete({ where: { id } });
    return ok({ id });
  }
);
