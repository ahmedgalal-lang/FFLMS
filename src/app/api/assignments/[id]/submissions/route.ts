import { NextRequest, NextResponse } from "next/server";
import { route } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { submitAssignment } from "@/server/services/submission";
import { submissionInputSchema } from "@/lib/validation";

/** POST /api/assignments/{id}/submissions — student submits text and/or a file. */
export const POST = route(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const input = submissionInputSchema.parse(await req.json());
    const submission = await submitAssignment(principal, id, input);
    return NextResponse.json(submission, { status: 201 });
  },
);
