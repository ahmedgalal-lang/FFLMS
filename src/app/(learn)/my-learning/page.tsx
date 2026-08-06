import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Award, BookOpen } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { listMyEnrollments } from "@/server/services/enrollment";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My Learning" };

export default async function MyLearningPage() {
  const principal = await requirePrincipal();
  const enrollments = await listMyEnrollments(principal);

  const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
  const inProgress = enrollments.filter(
    (e) => e.status !== "COMPLETED" && e.progressPercent > 0,
  ).length;
  const stats = [
    { label: "Enrolled courses", value: enrollments.length, icon: BookOpen },
    { label: "In progress", value: inProgress, icon: GraduationCap },
    { label: "Completed", value: completed, icon: Award },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Learning</h1>

      {enrollments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">
            You haven&apos;t enrolled in any courses yet.
          </p>
          <Button asChild className="mt-4">
            <Link href="/courses">Browse the catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enr) => {
            const done = enr.status === "COMPLETED";
            return (
              <div
                key={enr.id}
                className="flex flex-col gap-3 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/learn/${enr.course.slug}`}
                      className="font-semibold hover:text-primary hover:underline"
                    >
                      {enr.course.title}
                    </Link>
                    {done && <Badge variant="success">Completed</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {enr.course.instructor.name}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={enr.progressPercent} className="max-w-xs" />
                    <span className="text-xs text-muted-foreground">
                      {enr.progressPercent}%
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {done && (
                    <Button variant="default" size="sm" asChild>
                      <Link href={`/learn/${enr.course.slug}/grades`}>
                        <Award className="h-4 w-4" /> View certificate
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/learn/${enr.course.slug}`}>
                      {done ? "Review" : enr.progressPercent > 0 ? "Continue" : "Start"}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
