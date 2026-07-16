import { NextRequest, NextResponse } from "next/server";
import { route } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { markLessonComplete } from "@/server/services/progress";
import { lessonCompleteSchema } from "@/lib/validation";

/** POST /api/lessons/{id}/complete — mark a lesson complete for the student. */
export const POST = route(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { lastPositionSec } = lessonCompleteSchema.parse(body);
    const result = await markLessonComplete(principal, id, lastPositionSec);
    return NextResponse.json(result);
  },
);
