import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyCertificate } from "@/server/services/certificate";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Certificate verification" };

export default async function VerifyResultPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const verdict = await verifyCertificate(decodeURIComponent(code));

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      {verdict.valid ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-3 text-xl font-bold text-green-900">
            Valid certificate
          </h1>
          <dl className="mt-4 space-y-2 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Holder</dt>
              <dd className="font-medium">{verdict.holderName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Course</dt>
              <dd className="font-medium">{verdict.courseTitle}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Issued</dt>
              <dd className="font-medium">
                {new Date(verdict.issuedAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-3 text-xl font-bold">
            {verdict.reason === "REVOKED"
              ? "Certificate revoked"
              : "Certificate not found"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {verdict.reason === "REVOKED"
              ? "This certificate has been revoked and is no longer valid."
              : "No certificate matches that verification code."}
          </p>
        </div>
      )}

      <div className="flex justify-center gap-2">
        {verdict.valid && (
          <Button asChild>
            <a
              href={`/api/certificates/${encodeURIComponent(code)}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download PDF
            </a>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/verify">Verify another</Link>
        </Button>
      </div>
    </div>
  );
}
