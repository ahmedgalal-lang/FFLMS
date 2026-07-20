import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { verifyCertificate } from "@/server/services/certificate";

/** GET /api/certificates/verify/{code} — public certificate verification. */
export const GET = route(
  async (_req: Request, ctx: { params: Promise<{ code: string }> }) => {
    const { code } = await ctx.params;
    const verdict = await verifyCertificate(code);
    return NextResponse.json(verdict);
  },
);
