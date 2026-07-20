import Link from "next/link";
import { BookOpen, GraduationCap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";

export default async function HomePage() {
  const publishedCount = await db.course.count({
    where: { status: "PUBLISHED", deletedAt: null },
  });

  return (
    <div className="space-y-16">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Learn anything. Teach everything.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A modern learning platform where instructors publish courses and
          students learn at their own pace with tracked progress and verifiable
          certificates.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/courses">Browse {publishedCount} courses</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-up">Start teaching</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            icon: BookOpen,
            title: "Structured courses",
            body: "Modules and lessons with video, rich text, and downloadable files.",
          },
          {
            icon: GraduationCap,
            title: "Track your progress",
            body: "Pick up right where you left off; see completion at a glance.",
          },
          {
            icon: Award,
            title: "Earn certificates",
            body: "Complete a course and receive a verifiable certificate.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg border bg-card p-6">
            <Icon className="h-8 w-8 text-primary" />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
