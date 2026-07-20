import Link from "next/link";
import type { Metadata } from "next";
import { Users, BookOpen, GraduationCap, ClipboardCheck } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { getAdminOverview } from "@/server/services/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminDashboard() {
  const principal = await requirePrincipal();
  const o = await getAdminOverview(principal);

  const stats = [
    { label: "Users", value: o.users, icon: Users, sub: `${o.instructors} instructors · ${o.students} students` },
    { label: "Published courses", value: o.published, icon: BookOpen, sub: `${o.inReview} awaiting review` },
    { label: "Enrollments", value: o.enrollments, icon: GraduationCap, sub: `${o.completions} completed` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground">Organization overview and controls.</p>
      </div>
      <AdminNav />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {o.inReview > 0 && (
        <Link
          href="/admin/review"
          className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 hover:bg-amber-100"
        >
          <ClipboardCheck className="h-5 w-5" />
          {o.inReview} course{o.inReview === 1 ? "" : "s"} awaiting your review →
        </Link>
      )}
    </div>
  );
}
