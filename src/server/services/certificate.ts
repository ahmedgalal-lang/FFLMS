import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";

/**
 * Certificate verification & management (FR-024, SC-008).
 *
 * Issuance happens automatically on course completion (see progress.ts). This
 * module handles public verification and instructor/admin revocation.
 */

export type VerificationVerdict =
  | { valid: true; holderName: string; courseTitle: string; issuedAt: Date }
  | { valid: false; reason: "NOT_FOUND" | "REVOKED" };

/** Certificate shape the pure verdict needs (null = code never issued). */
export type VerifiableCertificate = {
  revokedAt: Date | null;
  issuedAt: Date;
  student: { name: string };
  course: { title: string };
} | null;

/**
 * Pure verdict for a looked-up certificate. Kept pure so the issued / never /
 * revoked cases are exhaustively unit-tested without a database (SC-008).
 */
export function certificateVerdict(
  cert: VerifiableCertificate,
): VerificationVerdict {
  if (!cert) return { valid: false, reason: "NOT_FOUND" };
  if (cert.revokedAt) return { valid: false, reason: "REVOKED" };
  return {
    valid: true,
    holderName: cert.student.name,
    courseTitle: cert.course.title,
    issuedAt: cert.issuedAt,
  };
}

/** Public verification by code — no authentication required. */
export async function verifyCertificate(
  code: string,
): Promise<VerificationVerdict> {
  const cert = await db.certificate.findUnique({
    where: { verificationCode: code },
    select: {
      revokedAt: true,
      issuedAt: true,
      student: { select: { name: true } },
      course: { select: { title: true } },
    },
  });
  return certificateVerdict(cert);
}

/** The acting student's certificates (for their grades/achievements view). */
export async function listMyCertificates(principal: Principal) {
  return db.certificate.findMany({
    where: { studentId: principal.id },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      verificationCode: true,
      issuedAt: true,
      revokedAt: true,
      course: { select: { title: true, slug: true } },
    },
  });
}

/** Revoke a certificate — the owning course's instructor (or an admin). */
export async function revokeCertificate(
  principal: Principal,
  certificateId: string,
) {
  const cert = await db.certificate.findUnique({
    where: { id: certificateId },
    select: { id: true, courseId: true, revokedAt: true },
  });
  if (!cert) throw new NotFoundError("Certificate not found.");
  const course = await loadCourseForAuthz(cert.courseId);
  // Reuse the gradebook/course-management authorization.
  authorize(principal, { type: "gradebook:read", course });

  return db.certificate.update({
    where: { id: certificateId },
    data: { revokedAt: cert.revokedAt ?? new Date() },
  });
}
