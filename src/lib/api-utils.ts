import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status });
}

/**
 * Wraps a route handler with a shared error envelope so every route
 * returns the same shape for validation, not-found, and server errors.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        const first = error.issues[0];
        const path = first?.path.join(".");
        return fail(
          path ? `${path}: ${first.message}` : (first?.message ?? "Invalid input"),
          422,
          error.issues
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return fail("A record with that name already exists.", 409);
        }
        if (error.code === "P2025") {
          return fail("Record not found.", 404);
        }
      }
      console.error("[api]", error);
      return fail("Something went wrong on the server.", 500);
    }
  };
}
