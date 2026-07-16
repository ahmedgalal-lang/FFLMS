import { NextRequest, NextResponse } from "next/server";
import { route } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { presignSchema } from "@/lib/validation";
import { createPresignedUpload } from "@/server/storage";

/**
 * Issue a presigned upload URL. Only authenticated instructors/admins (course
 * authoring) or students (assignment submissions) need this; any signed-in user
 * may request one, and the ultimate resource write is authorized separately.
 */
export const POST = route(async (req: NextRequest) => {
  await requirePrincipal();
  const body = await req.json();
  const input = presignSchema.parse(body);
  const presigned = await createPresignedUpload(input);
  return NextResponse.json(presigned);
});
