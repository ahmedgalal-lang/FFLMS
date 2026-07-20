import { describe, it, expect } from "vitest";
import {
  certificateVerdict,
  type VerifiableCertificate,
} from "@/server/services/certificate";

const issued: VerifiableCertificate = {
  revokedAt: null,
  issuedAt: new Date("2026-01-01T00:00:00Z"),
  student: { name: "Sam Student" },
  course: { title: "Intro to Next.js" },
};

describe("certificateVerdict (SC-008)", () => {
  it("reports a valid, issued certificate with holder and course", () => {
    const v = certificateVerdict(issued);
    expect(v.valid).toBe(true);
    if (v.valid) {
      expect(v.holderName).toBe("Sam Student");
      expect(v.courseTitle).toBe("Intro to Next.js");
      expect(v.issuedAt).toEqual(issued!.issuedAt);
    }
  });

  it("reports NOT_FOUND for a code that was never issued", () => {
    const v = certificateVerdict(null);
    expect(v).toEqual({ valid: false, reason: "NOT_FOUND" });
  });

  it("reports REVOKED for a revoked certificate", () => {
    const v = certificateVerdict({ ...issued, revokedAt: new Date() });
    expect(v).toEqual({ valid: false, reason: "REVOKED" });
  });
});
