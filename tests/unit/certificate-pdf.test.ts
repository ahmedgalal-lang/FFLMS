import { describe, it, expect } from "vitest";
import { renderCertificatePdf } from "@/server/services/certificate-pdf";

/** A PDF always starts with the "%PDF" magic bytes. */
function isPdf(bytes: Uint8Array) {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

describe("certificate PDF (T063)", () => {
  const base = {
    issuedAt: new Date("2026-01-15T00:00:00Z"),
    verificationCode: "ABC123XYZ",
  };

  it("renders for a plain Latin name", async () => {
    const pdf = await renderCertificatePdf({
      ...base,
      holderName: "Sam Student",
      courseTitle: "Intro to Next.js",
    });
    expect(isPdf(pdf)).toBe(true);
  });

  it("renders for an Arabic name and title (regression: WinAnsi crash)", async () => {
    const pdf = await renderCertificatePdf({
      ...base,
      holderName: "علي محمود",
      courseTitle: "تحليل البيانات للاستشاريين",
    });
    expect(isPdf(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it("renders for accented Latin characters", async () => {
    const pdf = await renderCertificatePdf({
      ...base,
      holderName: "José Ñoño",
      courseTitle: "Café & Résumé",
    });
    expect(isPdf(pdf)).toBe(true);
  });
});
