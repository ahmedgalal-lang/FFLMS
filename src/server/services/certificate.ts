import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, type PageParams } from "@/server/http";
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
  authorize(principal, { type: "certificate:manage", course });

  return db.certificate.update({
    where: { id: certificateId },
    data: { revokedAt: cert.revokedAt ?? new Date() },
  });
}

/** Restore a mistakenly revoked certificate. */
export async function reinstateCertificate(
  principal: Principal,
  certificateId: string,
) {
  const cert = await db.certificate.findUnique({
    where: { id: certificateId },
    select: { id: true, courseId: true },
  });
  if (!cert) throw new NotFoundError("Certificate not found.");
  const course = await loadCourseForAuthz(cert.courseId);
  authorize(principal, { type: "certificate:manage", course });

  return db.certificate.update({
    where: { id: certificateId },
    data: { revokedAt: null },
  });
}

/** All certificates issued for one course — instructor of that course, or an admin. */
export async function listCourseCertificates(
  principal: Principal,
  courseId: string,
) {
  const course = await loadCourseForAuthz(courseId);
  authorize(principal, { type: "certificate:manage", course });

  return db.certificate.findMany({
    where: { courseId },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      verificationCode: true,
      issuedAt: true,
      revokedAt: true,
      student: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Org-wide certificate listing for the admin console. */
export async function listAllCertificates(
  principal: Principal,
  filter: { q?: string },
  page: PageParams,
) {
  authorize(principal, { type: "admin:certificates" });

  const where: Prisma.CertificateWhereInput = filter.q
    ? {
        OR: [
          { student: { name: { contains: filter.q, mode: "insensitive" } } },
          { student: { email: { contains: filter.q, mode: "insensitive" } } },
          { course: { title: { contains: filter.q, mode: "insensitive" } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    db.certificate.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      skip: page.skip,
      take: page.pageSize,
      select: {
        id: true,
        verificationCode: true,
        issuedAt: true,
        revokedAt: true,
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    }),
    db.certificate.count({ where }),
  ]);
  return { items, total };
}
