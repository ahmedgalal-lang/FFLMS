"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  revokeCertificateAction,
  reinstateCertificateAction,
} from "@/app/(teach)/studio/[courseId]/certificates/actions";

type Certificate = {
  id: string;
  verificationCode: string;
  issuedAt: string;
  revokedAt: string | null;
  student: { id: string; name: string; email: string };
};

export function CertificatePanel({
  courseId,
  certificates,
}: {
  courseId: string;
  certificates: Certificate[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(cert: Certificate) {
    setError(null);
    startTransition(async () => {
      const res = cert.revokedAt
        ? await reinstateCertificateAction(courseId, cert.id)
        : await revokeCertificateAction(courseId, cert.id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <h2 className="text-sm font-medium text-muted-foreground">
        {certificates.length} certificate{certificates.length === 1 ? "" : "s"}{" "}
        issued
      </h2>
      {certificates.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No certificates issued yet — they appear here as students complete
          the course.
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {certificates.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{c.student.name}</p>
                  {c.revokedAt && <Badge variant="destructive">Revoked</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{c.student.email}</p>
                <p className="text-xs text-muted-foreground">
                  Issued {new Date(c.issuedAt).toLocaleDateString()} ·{" "}
                  <Link
                    href={`/verify/${c.verificationCode}`}
                    className="hover:underline"
                    target="_blank"
                  >
                    {c.verificationCode}
                  </Link>
                </p>
              </div>
              <Button
                variant={c.revokedAt ? "outline" : "destructive"}
                size="sm"
                disabled={pending}
                onClick={() => toggle(c)}
                aria-label={
                  c.revokedAt
                    ? `Reinstate ${c.student.name}'s certificate`
                    : `Revoke ${c.student.name}'s certificate`
                }
              >
                {c.revokedAt ? (
                  <>
                    <RotateCcw /> Reinstate
                  </>
                ) : (
                  <>
                    <X /> Revoke
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
