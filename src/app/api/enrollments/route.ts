import { NextRequest, NextResponse } from "next/server";
import { route } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { enroll, listMyEnrollments } from "@/server/services/enrollment";
import { enrollSchema } from "@/lib/validation";

/** GET /api/enrollments — the acting student's enrollments (My Learning). */
export const GET = route(async () => {
  const principal = await requirePrincipal();
  const items = await listMyEnrollments(principal);
  return NextResponse.json({ items });
});

/** POST /api/enrollments — idempotent enroll in a published course. */
export const POST = route(async (req: NextRequest) => {
  const principal = await requirePrincipal();
  const { courseId } = enrollSchema.parse(await req.json());
  const enrollment = await enroll(principal, courseId);
  return NextResponse.json(enrollment, { status: 201 });
});
