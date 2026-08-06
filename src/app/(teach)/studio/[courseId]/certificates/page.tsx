import Link from "next/link";
import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { listCourseCertificates } from "@/server/services/certificate";
import { CertificatePanel } from "@/components/course/certificate-panel";

export const metadata: Metadata = { title: "Certificates" };

export default async function CourseCertificatesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const principal = await requirePrincipal();
  const certificates = await listCourseCertificates(principal, courseId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/studio/${courseId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Certificates</h1>
        <p className="text-sm text-muted-foreground">
          Certificates issue automatically when a student completes this
          course. Revoke one if it was issued in error.
        </p>
      </div>

      <CertificatePanel
        courseId={courseId}
        certificates={certificates.map((c) => ({
          id: c.id,
          verificationCode: c.verificationCode,
          issuedAt: c.issuedAt.toISOString(),
          revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
          student: c.student,
        }))}
      />
    </div>
  );
}
