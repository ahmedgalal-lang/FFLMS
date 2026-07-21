import type { Metadata } from "next";
import { Users, GraduationCap, CheckCircle2, BookOpen, Award } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { getOrgReports } from "@/server/services/analytics";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Reports · Admin" };

export default async function AdminReportsPage() {
  const principal = await requirePrincipal();
  const r = await getOrgReports(principal);

  const stats = [
    { label: "Users", value: r.totalUsers, icon: Users },
    { label: "Published courses", value: r.publishedCourses, icon: BookOpen },
    { label: "Enrollments", value: r.totalEnrollments, icon: GraduationCap },
    {
      label: "Completions",
      value: r.totalCompletions,
      sub: `${r.overallCompletionRate}% completion rate`,
      icon: CheckCircle2,
    },
    { label: "Certificates issued", value: r.certificates, icon: Award },
  ];

  const maxEnroll = Math.max(1, ...r.topCourses.map((c) => c.enrollments));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Organization-wide activity.</p>
      </div>
      <AdminNav />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Top courses by enrollment</h2>
        {r.topCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enrollments yet.</p>
        ) : (
          <div className="space-y-2 rounded-lg border p-4">
            {r.topCourses.map((c) => (
              <div key={c.title} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.title}</span>
                  <span className="tabular-nums text-muted-foreground">{c.enrollments}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(c.enrollments / maxEnroll) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
