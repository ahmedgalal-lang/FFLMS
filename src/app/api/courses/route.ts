import { NextRequest, NextResponse } from "next/server";
import { route, parsePagination, pageMeta } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { createCourse } from "@/server/services/course";
import { searchCatalog } from "@/server/services/catalog";
import { courseCreateSchema, catalogQuerySchema } from "@/lib/validation";

/** GET /api/courses — public catalog search. */
export const GET = route(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const query = catalogQuerySchema.parse({
    q: sp.get("q") ?? undefined,
    category: sp.get("category") ?? undefined,
    page: sp.get("page") ?? undefined,
  });
  const pagination = parsePagination(sp);
  const { items, total } = await searchCatalog(query, pagination);
  return NextResponse.json({ items, ...pageMeta(total, pagination) });
});

/** POST /api/courses — create a draft course (instructor). */
export const POST = route(async (req: NextRequest) => {
  const principal = await requirePrincipal();
  const body = await req.json();
  const input = courseCreateSchema.parse(body);
  const course = await createCourse(principal, input);
  return NextResponse.json(course, { status: 201 });
});
