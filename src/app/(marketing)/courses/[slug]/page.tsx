import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Badge, Button, ButtonLink, Card } from "@/components/ui";
import { getPublishedCourseBySlug } from "@/server/services/catalog";
import { enroll, getEnrollment } from "@/server/services/enrollment";
import { currentActor, auth } from "@/server/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  return { title: course?.title ?? "Course" };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  if (!course) notFound();

  const session = await auth();
  const actor = await currentActor();
  const enrollment =
    actor?.role === "STUDENT" ? await getEnrollment(actor, course.id) : null;

  const totalLessons = course.modules.reduce(
    (n, m) => n + m.lessons.length,
    0,
  );

  async function enrollAction() {
    "use server";
    const a = await currentActor();
    if (!a) redirect(`/sign-in`);
    await enroll(a, course!.id);
    redirect(`/learn/${course!.slug}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {course.category ? <Badge tone="brand">{course.category.name}</Badge> : null}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
            {course.title}
          </h1>
          <p className="mt-2 text-lg text-ink-2">{course.summary}</p>
          <p className="mt-1 text-sm text-ink-3">
            By {course.instructor.name} · {totalLessons} lessons
          </p>

          <div className="mt-6 whitespace-pre-line text-ink-2">
            {course.description}
          </div>

          <h2 className="mt-10 text-lg font-semibold tracking-tight">
            What you&rsquo;ll cover
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {course.modules.map((m, i) => (
              <Card key={m.id} className="p-4">
                <div className="text-sm font-semibold">
                  {i + 1}. {m.title}
                </div>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink-2">
                  {m.lessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-brand"
                        aria-hidden
                      />
                      {l.title}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        <aside className="lg:pt-10">
          <Card className="sticky top-6 p-5">
            <div
              className="mb-4 aspect-[16/9] rounded-lg bg-gradient-to-br from-brand-soft to-surface-2"
              aria-hidden
            />
            {enrollment ? (
              <>
                <Badge tone="success">Enrolled</Badge>
                <ButtonLink
                  href={`/learn/${course.slug}`}
                  className="mt-4 w-full"
                >
                  Continue learning
                </ButtonLink>
              </>
            ) : session?.user && actor?.role !== "STUDENT" ? (
              <p className="text-sm text-ink-2">
                Enrollment is for student accounts. You&rsquo;re signed in as{" "}
                {actor?.role.toLowerCase()}.
              </p>
            ) : (
              <form action={enrollAction}>
                <p className="mb-3 text-sm text-ink-2">
                  Free to enroll. Start learning right away.
                </p>
                <Button type="submit" className="w-full">
                  Enroll now
                </Button>
              </form>
            )}
          </Card>
        </aside>
      </div>
    </main>
  );
}
