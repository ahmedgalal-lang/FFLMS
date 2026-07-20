import { NextRequest, NextResponse } from "next/server";
import { route } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { submitAttempt } from "@/server/services/attempt";
import { submitAttemptSchema } from "@/lib/validation";

/** POST /api/attempts/{id}/submit — grade the attempt server-side. */
export const POST = route(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const input = submitAttemptSchema.parse(body);
    const result = await submitAttempt(principal, id, input);
    return NextResponse.json(result);
  },
);
