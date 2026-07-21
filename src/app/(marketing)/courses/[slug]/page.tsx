import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, Users, CheckCircle2 } from "lucide-react";
import { getPublicCourse } from "@/server/services/catalog";
import { getPrincipal } from "@/server/auth";
import { getEnrollment } from "@/server/services/enrollment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnrollButton } from "@/components/course/enroll-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourse(slug);
  return { title: course?.title ?? "Course" };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getPublicCourse(slug);
  if (!course) notFound();

  const principal = await getPrincipal();
  const enrollment =
    principal && principal.role === "STUDENT"
      ? await getEnrollment(principal, course.id)
      : null;

  const lessonCount = course.modules.reduce(
    (n, m) => n + m.lessons.length,
    0,
  );
  const totalMinutes = course.modules.reduce(
    (n, m) =>
      n + m.lessons.reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0),
    0,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {course.coverImageUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div>
          {course.category && (
            <Badge variant="secondary">{course.category.name}</Badge>
          )}
          <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>
          <p className="mt-2 text-muted-foreground">{course.summary}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            By {course.instructor.name}
          </p>
        </div>

        {course.description && (
          <div className="prose prose-sm max-w-none">
            <p>{course.description}</p>
          </div>
        )}

        <section>
          <h2 className="mb-3 text-xl font-semibold">Curriculum</h2>
          <div className="space-y-3">
            {course.modules.map((mod, mi) => (
              <div key={mod.id} className="rounded-lg border">
                <div className="border-b bg-muted/40 px-4 py-2 font-medium">
                  Module {mi + 1}: {mod.title}
                </div>
                <ul className="divide-y">
                  {mod.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm"
                    >
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.title}</span>
                      {lesson.quiz && (
                        <Badge variant="outline" className="ml-auto">
                          Quiz
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Enroll sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border bg-card p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <dd>{lessonCount} lessons</dd>
            </div>
            {totalMinutes > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <dd>~{totalMinutes} min</dd>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <dd>{course._count.enrollments} enrolled</dd>
            </div>
          </dl>

          <div className="mt-6">
            {enrollment ? (
              <Button asChild className="w-full">
                <Link href={`/learn/${course.slug}`}>
                  <CheckCircle2 /> Continue learning
                </Link>
              </Button>
            ) : (
              <EnrollButton courseId={course.id} courseSlug={course.slug} />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
