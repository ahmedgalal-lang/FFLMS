import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { startAttempt } from "@/server/services/attempt";

/** POST /api/quizzes/{id}/attempts — start (or resume) an attempt. */
export const POST = route(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const attempt = await startAttempt(principal, id);
    return NextResponse.json(attempt, { status: 201 });
  },
);
