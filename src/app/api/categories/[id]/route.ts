import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, withErrorHandling } from "@/lib/api-utils";
import { categorySchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    const input = categorySchema.partial().parse(await request.json());
    const category = await prisma.category.update({ where: { id }, data: input });
    return ok(category);
  }
);

export const DELETE = withErrorHandling(
  async (_request: NextRequest, { params }: RouteContext) => {
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return ok({ id });
  }
);
