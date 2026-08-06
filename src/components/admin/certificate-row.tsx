"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  revokeCertificateAdminAction,
  reinstateCertificateAdminAction,
} from "@/app/(admin)/admin/actions";

type AdminCertificate = {
  id: string;
  verificationCode: string;
  issuedAt: string;
  revokedAt: string | null;
  student: { id: string; name: string; email: string };
  course: { id: string; title: string; slug: string };
};

export function CertificateRow({ certificate: c }: { certificate: AdminCertificate }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = c.revokedAt
        ? await reinstateCertificateAdminAction(c.id)
        : await revokeCertificateAdminAction(c.id);
      if (!res?.error) router.refresh();
    });
  }

  return (
    <tr className="border-b last:border-0 align-top">
      <td className="p-3">
        <div className="font-medium">{c.student.name}</div>
        <div className="text-xs text-muted-foreground">{c.student.email}</div>
      </td>
      <td className="p-3">
        <Link href={`/courses/${c.course.slug}`} className="hover:underline">
          {c.course.title}
        </Link>
        <div className="text-xs text-muted-foreground">
          <Link href={`/verify/${c.verificationCode}`} target="_blank" className="hover:underline">
            {c.verificationCode}
          </Link>
        </div>
      </td>
      <td className="p-3 text-xs text-muted-foreground">
        {new Date(c.issuedAt).toLocaleDateString()}
      </td>
      <td className="p-3">
        <Badge variant={c.revokedAt ? "destructive" : "success"}>
          {c.revokedAt ? "revoked" : "active"}
        </Badge>
      </td>
      <td className="p-3">
        <Button
          variant={c.revokedAt ? "outline" : "destructive"}
          size="sm"
          disabled={pending}
          onClick={toggle}
        >
          {c.revokedAt ? "Reinstate" : "Revoke"}
        </Button>
      </td>
    </tr>
  );
}
