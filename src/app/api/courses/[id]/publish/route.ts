import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { publishCourse } from "@/server/services/publish";

/** POST /api/courses/{id}/publish — publish when the completeness gate passes. */
export const POST = route(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const course = await publishCourse(principal, id);
    return NextResponse.json(course);
  },
);
