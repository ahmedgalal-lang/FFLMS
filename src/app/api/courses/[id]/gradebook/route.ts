import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { getGradebook } from "@/server/services/gradebook";

/** GET /api/courses/{id}/gradebook — instructor gradebook aggregation. */
export const GET = route(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const gradebook = await getGradebook(principal, id);
    return NextResponse.json(gradebook);
  },
);
