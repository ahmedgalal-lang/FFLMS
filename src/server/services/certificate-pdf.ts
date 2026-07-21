import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Render a simple, self-contained certificate PDF. No external assets — uses
 * standard fonts so it works in any (serverless) runtime.
 */
export async function renderCertificatePdf(params: {
  holderName: string;
  courseTitle: string;
  issuedAt: Date;
  verificationCode: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  const navy = rgb(0.12, 0.16, 0.29);
  const gold = rgb(0.72, 0.55, 0.18);
  const gray = rgb(0.4, 0.4, 0.45);

  // Border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: gold,
    borderWidth: 2,
  });

  const center = (text: string, y: number, font: typeof serif, size: number, color = navy) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  center("CERTIFICATE OF COMPLETION", height - 130, serifBold, 30, navy);
  center("This certifies that", height - 190, serif, 16, gray);
  center(params.holderName, height - 240, serifBold, 34, navy);
  center("has successfully completed", height - 290, serif, 16, gray);
  center(params.courseTitle, height - 335, serifBold, 24, gold);

  center(
    `Issued ${params.issuedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    150,
    sans,
    12,
    gray,
  );
  center(`Verification code: ${params.verificationCode}`, 120, sans, 11, gray);
  center("Verify at /verify", 100, sans, 10, gray);

  return doc.save();
}
