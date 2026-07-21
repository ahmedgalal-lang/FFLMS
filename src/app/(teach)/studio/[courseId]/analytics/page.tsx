import Link from "next/link";
import type { Metadata } from "next";
import { Users, CheckCircle2, HelpCircle, ClipboardList } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { getCourseAnalytics } from "@/server/services/analytics";

export const metadata: Metadata = { title: "Analytics" };

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default async function CourseAnalyticsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const principal = await requirePrincipal();
  const a = await getCourseAnalytics(principal, courseId);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/studio/${courseId}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Analytics · {a.course.title}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Enrollments"
          value={a.enrollments.total}
          sub={`${a.enrollments.active} active · ${a.enrollments.completed} completed`}
          icon={Users}
        />
        <StatCard
          label="Completion rate"
          value={`${a.completionRate}%`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Avg quiz score"
          value={a.avgQuizScore == null ? "—" : `${a.avgQuizScore}%`}
          sub={`${a.quizAttempts} attempts`}
          icon={HelpCircle}
        />
        <StatCard
          label="Avg assignment"
          value={a.avgAssignmentScore == null ? "—" : `${a.avgAssignmentScore}`}
          sub={`${a.gradedSubmissions} graded`}
          icon={ClipboardList}
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Per-lesson completion (drop-off)</h2>
        {a.lessonDropoff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lessons yet.</p>
        ) : (
          <div className="space-y-2 rounded-lg border p-4">
            {a.lessonDropoff.map((l, i) => (
              <div key={l.lessonId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    <span className="text-muted-foreground">{i + 1}.</span> {l.title}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {l.completed} · {l.completionRate}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${l.completionRate}%` }}
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
