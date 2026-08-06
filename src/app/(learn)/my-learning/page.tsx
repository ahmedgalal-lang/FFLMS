import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Award, BookOpen, ArrowRight, Flame } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { db } from "@/server/db";
import { listMyEnrollments } from "@/server/services/enrollment";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My Learning" };

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function MyLearningPage() {
  const principal = await requirePrincipal();
  const [user, enrollments] = await Promise.all([
    db.user.findUnique({ where: { id: principal.id }, select: { name: true } }),
    listMyEnrollments(principal),
  ]);

  const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
  const active = enrollments
    .filter((e) => e.status !== "COMPLETED")
    .sort((a, b) => b.progressPercent - a.progressPercent);
  const inProgress = active.filter((e) => e.progressPercent > 0).length;
  const featured = active[0] ?? null;

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getUTCHours();

  const stats = [
    {
      label: "Enrolled courses",
      value: enrollments.length,
      icon: BookOpen,
      badge: "bg-primary/10 text-primary",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: Flame,
      badge: "bg-brand-orange text-brand-navy",
    },
    {
      label: "Completed",
      value: completed,
      icon: Award,
      badge: "bg-green-600/10 text-green-700",
    },
  ];

  let subtitle = "Browse the catalog to start your first course.";
  if (enrollments.length > 0) {
    if (completed === enrollments.length) {
      subtitle = "You've completed everything you're enrolled in — nice work.";
    } else if (featured && featured.progressPercent > 0) {
      subtitle = `You're ${featured.progressPercent}% through "${featured.course.title}" — keep going.`;
    } else {
      subtitle =
        enrollments.length === 1
          ? "You have a course ready to start."
          : `You have ${enrollments.length} courses ready to start.`;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting(hour)}, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
      </div>

      {enrollments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, badge }) => (
            <div key={label} className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${badge}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}

      {featured && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="grid sm:grid-cols-[minmax(0,320px)_1fr]">
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/15 to-brand-navy/10 sm:aspect-auto">
              {featured.course.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.course.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <GraduationCap className="h-14 w-14 text-primary/30" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-3 p-6">
              <Badge className="w-fit border-transparent bg-brand-orange text-brand-navy">
                {featured.progressPercent > 0 ? "Continue learning" : "Up next"}
              </Badge>
              <Link
                href={`/learn/${featured.course.slug}`}
                className="text-xl font-bold leading-tight hover:text-primary hover:underline"
              >
                {featured.course.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {featured.course.instructor.name}
              </p>
              <div className="flex items-center gap-3">
                <Progress value={featured.progressPercent} className="max-w-xs" />
                <span className="text-xs text-muted-foreground">
                  {featured.progressPercent}%
                </span>
              </div>
              <Button
                asChild
                className="mt-1 w-fit bg-brand-orange text-brand-navy hover:bg-brand-orange/90"
              >
                <Link href={`/learn/${featured.course.slug}`}>
                  {featured.progressPercent > 0 ? "Continue" : "Start"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
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
          <h2 className="text-sm font-medium text-muted-foreground">
            All courses
          </h2>
          {enrollments.map((enr) => {
            const done = enr.status === "COMPLETED";
            return (
              <div
                key={enr.id}
                className="flex flex-col gap-3 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="hidden h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-primary/10 to-brand-navy/5 sm:flex">
                    {enr.course.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={enr.course.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <GraduationCap className="h-6 w-6 text-primary/30" />
                    )}
                  </div>
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
