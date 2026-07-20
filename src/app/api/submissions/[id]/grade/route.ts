import { NextRequest, NextResponse } from "next/server";
import { route } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { gradeSubmission } from "@/server/services/submission";
import { gradeSubmissionSchema } from "@/lib/validation";

/** POST /api/submissions/{id}/grade — instructor grades a submission. */
export const POST = route(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const input = gradeSubmissionSchema.parse(await req.json());
    const graded = await gradeSubmission(principal, id, input);
    return NextResponse.json(graded);
  },
);
