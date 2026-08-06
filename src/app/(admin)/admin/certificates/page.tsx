import type { Metadata } from "next";
import Link from "next/link";
import { requirePrincipal } from "@/server/auth";
import { listAllCertificates } from "@/server/services/certificate";
import { parsePagination, pageMeta } from "@/server/http";
import { adminCertificatesQuerySchema } from "@/lib/validation";
import { AdminNav } from "@/components/admin/admin-nav";
import { CertificateRow } from "@/components/admin/certificate-row";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Certificates · Admin" };

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const principal = await requirePrincipal();
  const query = adminCertificatesQuerySchema.parse({ q: sp.q, page: sp.page });
  const pagination = parsePagination(
    new URLSearchParams({ page: String(query.page ?? 1), pageSize: "25" }),
  );
  const { items, total } = await listAllCertificates(
    principal,
    { q: query.q },
    pagination,
  );
  const meta = pageMeta(total, pagination);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Certificates</h1>
        <p className="text-sm text-muted-foreground">{total} issued org-wide</p>
      </div>
      <AdminNav />

      <form className="flex flex-wrap gap-2" action="/admin/certificates">
        <Input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search student, email, or course…"
          className="max-w-xs"
          aria-label="Search certificates"
        />
        <Button type="submit">Search</Button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No certificates match.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Student</th>
                <th className="p-3 font-medium">Course</th>
                <th className="p-3 font-medium">Issued</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <CertificateRow
                  key={c.id}
                  certificate={{
                    id: c.id,
                    verificationCode: c.verificationCode,
                    issuedAt: c.issuedAt.toISOString(),
                    revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
                    student: c.student,
                    course: c.course,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (query.q) params.set("q", query.q);
            params.set("page", String(p));
            return (
              <Button
                key={p}
                asChild
                variant={p === meta.page ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/admin/certificates?${params.toString()}`}>{p}</Link>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
