import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "@/server/access/policy";
import { logger } from "@/server/observability";

/** Domain error carrying an HTTP status — thrown by services. */
export class AppError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict.") {
    super(message, 409, "CONFLICT");
  }
}

/** Map any thrown error to a JSON error response. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof AuthorizationError) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: err.message } },
      { status: 403 },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "Invalid request.",
          issues: err.flatten(),
        },
      },
      { status: 422 },
    );
  }
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }
  logger.error({ err }, "unhandled route error");
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Something went wrong." } },
    { status: 500 },
  );
}

/** Wrap a route handler so thrown errors become uniform JSON responses. */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

// ---------- Pagination ----------

export type PageParams = { page: number; pageSize: number; skip: number };

export function parsePagination(
  searchParams: URLSearchParams,
  { defaultSize = 12, maxSize = 100 } = {},
): PageParams {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const rawSize = Number(searchParams.get("pageSize") ?? String(defaultSize));
  const pageSize = Math.min(maxSize, Math.max(1, rawSize || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function pageMeta(total: number, { page, pageSize }: PageParams) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
