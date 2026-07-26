import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { authOptions } from "@/lib/auth";
import { can, type Action, type Resource } from "@/lib/rbac";
import type { Role } from "@/lib/enums";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

/** Require an authenticated user or throw 401. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Authentication required");
  return user;
}

/** Require an authenticated user with permission for the action or throw. */
export async function requirePermission(
  action: Action,
  resource: Resource,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, action, resource)) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
  return user;
}

/** Parse a request body with a Zod schema, throwing a typed 400 on failure. */
export async function parseBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(400, "Validation failed", flattenZod(result.error));
  }
  return result.data;
}

export function flattenZod(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/** Wrap an async route handler, converting thrown errors into JSON responses. */
export function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  return fn().catch((error: unknown) => {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details ?? null },
        { status: error.status },
      );
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: flattenZod(error) },
        { status: 400 },
      );
    }
    console.error("Unhandled API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: null },
      { status: 500 },
    );
  });
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
