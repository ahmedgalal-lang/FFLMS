import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { getFile } from "@/server/services/files";

/** GET /api/files/{id} — serve a stored file. */
export const GET = route(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const file = await getFile(id);
    if (!file) {
      return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
    }
    const body = new Uint8Array(file.data);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(body.byteLength),
      },
    });
  },
);
