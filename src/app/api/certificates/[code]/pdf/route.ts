import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { verifyCertificate } from "@/server/services/certificate";
import { renderCertificatePdf } from "@/server/services/certificate-pdf";

/**
 * GET /api/certificates/{code}/pdf — public certificate PDF for a valid code.
 * Revoked or unknown codes get a 404 (no PDF for invalid certificates).
 */
export const GET = route(
  async (_req: Request, ctx: { params: Promise<{ code: string }> }) => {
    const { code } = await ctx.params;
    const verdict = await verifyCertificate(decodeURIComponent(code));
    if (!verdict.valid) {
      return NextResponse.json(
        { error: { message: "Certificate not available." } },
        { status: 404 },
      );
    }
    const pdf = await renderCertificatePdf({
      holderName: verdict.holderName,
      courseTitle: verdict.courseTitle,
      issuedAt: new Date(verdict.issuedAt),
      verificationCode: decodeURIComponent(code),
    });
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate-${code}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  },
);
