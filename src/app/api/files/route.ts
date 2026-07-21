import { NextRequest, NextResponse } from "next/server";
import { route, AppError } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { storeFile } from "@/server/services/files";

/**
 * POST /api/files — authenticated multipart upload; stores the file in the DB
 * and returns its id, public URL, name, and size.
 */
export const POST = route(async (req: NextRequest) => {
  const principal = await requirePrincipal();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new AppError("No file provided.", 400, "NO_FILE");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const stored = await storeFile(principal, {
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    bytes,
  });
  return NextResponse.json(stored, { status: 201 });
});
