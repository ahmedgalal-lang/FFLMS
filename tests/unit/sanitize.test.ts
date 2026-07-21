import { describe, it, expect } from "vitest";
import { sanitizeRichText } from "@/server/security/sanitize";

describe("sanitizeRichText (XSS defense)", () => {
  it("keeps safe formatting tags", () => {
    const out = sanitizeRichText("<p>Hello <strong>world</strong></p>");
    expect(out).toContain("<strong>world</strong>");
  });

  it("strips <script> tags", () => {
    const out = sanitizeRichText('<p>ok</p><script>alert(1)</script>');
    expect(out).not.toContain("script");
    expect(out).toContain("<p>ok</p>");
  });

  it("removes inline event handlers", () => {
    const out = sanitizeRichText('<p onclick="steal()">x</p>');
    expect(out).not.toContain("onclick");
  });

  it("drops javascript: URLs on links", () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });

  it("forces safe rel on links", () => {
    const out = sanitizeRichText('<a href="https://x.com" target="_blank">x</a>');
    expect(out).toContain("noopener");
  });

  it("strips img/iframe injection", () => {
    const out = sanitizeRichText('<img src=x onerror=alert(1)><iframe src="evil"></iframe>');
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("<iframe");
  });
});
