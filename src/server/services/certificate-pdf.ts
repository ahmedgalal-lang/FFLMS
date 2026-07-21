import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { convertArabic } from "arabic-reshaper";
import { amiriRegularBase64 } from "@/server/assets/fonts/regular";
import { amiriBoldBase64 } from "@/server/assets/fonts/bold";

/**
 * Render a self-contained certificate PDF. Names and course titles can contain
 * any script (Arabic, accented Latin, etc.), so we embed the Amiri Unicode font
 * — pdf-lib's built-in StandardFonts only support WinAnsi (Latin-1) and throw on
 * anything else. Arabic runs are reshaped into contextual presentation forms and
 * reordered right-to-left for correct display.
 */

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const LATINISH = /[A-Za-z0-9@._+\-/:]/;

/** Shape + reorder text so Arabic renders correctly in a left-to-right PDF. */
function shapeForPdf(text: string): string {
  if (!ARABIC_RE.test(text)) return text;
  const reshaped = convertArabic(text);
  // Reverse for RTL, then flip embedded Latin/number runs back to LTR.
  const chars = [...reshaped].reverse();
  let i = 0;
  while (i < chars.length) {
    if (LATINISH.test(chars[i]!)) {
      let j = i;
      while (j < chars.length && LATINISH.test(chars[j]!)) j++;
      const seg = chars.slice(i, j).reverse();
      for (let k = i; k < j; k++) chars[k] = seg[k - i]!;
      i = j;
    } else {
      i++;
    }
  }
  return chars.join("");
}

let fontsCache: { regular: Uint8Array; bold: Uint8Array } | null = null;
function loadFonts() {
  if (fontsCache) return fontsCache;
  fontsCache = {
    regular: new Uint8Array(Buffer.from(amiriRegularBase64, "base64")),
    bold: new Uint8Array(Buffer.from(amiriBoldBase64, "base64")),
  };
  return fontsCache;
}

export async function renderCertificatePdf(params: {
  holderName: string;
  courseTitle: string;
  issuedAt: Date;
  verificationCode: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Embed the Unicode font; fall back to a standard font if the asset is
  // somehow unavailable, so the endpoint degrades instead of failing.
  let body: PDFFont;
  let heading: PDFFont;
  let unicode = true;
  try {
    doc.registerFontkit(fontkit);
    const fonts = loadFonts();
    body = await doc.embedFont(fonts.regular, { subset: true });
    heading = await doc.embedFont(fonts.bold, { subset: true });
  } catch {
    unicode = false;
    body = await doc.embedFont(StandardFonts.TimesRoman);
    heading = await doc.embedFont(StandardFonts.TimesRomanBold);
  }

  const page = doc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  const navy = rgb(0.12, 0.16, 0.29);
  const gold = rgb(0.72, 0.55, 0.18);
  const gray = rgb(0.4, 0.4, 0.45);

  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: gold,
    borderWidth: 2,
  });

  // Make any text safe for the active font: shape Arabic when the Unicode font
  // is available; otherwise strip characters WinAnsi can't encode.
  const prep = (t: string) =>
    unicode ? shapeForPdf(t) : t.replace(/[^\x20-\x7E -ÿ]/g, "");

  const center = (
    text: string,
    y: number,
    font: PDFFont,
    size: number,
    color = navy,
  ) => {
    const safe = prep(text);
    const w = font.widthOfTextAtSize(safe, size);
    page.drawText(safe, { x: (width - w) / 2, y, size, font, color });
  };

  center("CERTIFICATE OF COMPLETION", height - 130, heading, 30, navy);
  center("This certifies that", height - 190, body, 16, gray);
  center(params.holderName, height - 240, heading, 34, navy);
  center("has successfully completed", height - 290, body, 16, gray);
  center(params.courseTitle, height - 335, heading, 24, gold);

  center(
    `Issued ${params.issuedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    150,
    body,
    12,
    gray,
  );
  center(`Verification code: ${params.verificationCode}`, 120, body, 11, gray);
  center("Verify at /verify", 100, body, 10, gray);

  return doc.save();
}
