import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Button, ButtonLink, Card, ProgressBar } from "@/components/ui";
import { currentActor } from "@/server/auth";
import { getPublishedCourseBySlug } from "@/server/services/catalog";
import { getCourseProgress } from "@/server/services/progress";
import { getLessonForLearner } from "@/server/services/player";
import { completeLessonAction } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  return { title: course ? `Learn · ${course.title}` : "Learn" };
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { slug } = await params;
  const { lesson: lessonParam } = await searchParams;
  const actor = await currentActor();
  if (!actor) redirect("/sign-in");

  const course = await getPublishedCourseBySlug(slug);
  if (!course) notFound();

  const progress = await getCourseProgress(actor, course.id);
  if (!progress.enrollment) {
    // Not enrolled → send to the detail page to enroll first.
    redirect(`/courses/${slug}`);
  }

  const orderedLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
  );
  const currentId =
    lessonParam ?? progress.resumeLessonId ?? orderedLessons[0]?.id;
  const currentLesson = currentId
    ? await getLessonForLearner(actor, currentId)
    : null;

  const isCurrentComplete = currentId
    ? progress.completedLessonIds.has(currentId)
    : false;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-5">
        <Link href="/my-learning" className="text-sm text-ink-3 hover:text-ink">
          ← My Learning
        </Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          {course.title}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Player */}
        <div>
          {currentLesson ? (
            <Card className="overflow-hidden">
              <div className="border-b border-line p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                  {currentLesson.module.title}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {currentLesson.title}
                </h2>
              </div>
              <div className="flex flex-col gap-4 p-5">
                {currentLesson.contentBlocks.length === 0 ? (
                  <p className="text-ink-3">No content in this lesson yet.</p>
                ) : (
                  currentLesson.contentBlocks.map((b) => (
                    <div key={b.id}>
                      {b.type === "VIDEO" && b.mediaUrl ? (
                        <div className="grid aspect-video place-items-center rounded-lg bg-surface-2 text-ink-3">
                          <span className="text-sm">Video: {b.mediaUrl}</span>
                        </div>
                      ) : b.type === "FILE" && b.mediaUrl ? (
                        <a
                          href={b.mediaUrl}
                          className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:border-ink-3"
                        >
                          📎 {b.fileName ?? "Download file"}
                        </a>
                      ) : (
                        <p className="whitespace-pre-line text-ink-2">
                          {b.text}
                        </p>
                      )}
                    </div>
                  ))
                )}

                <div className="flex items-center justify-between border-t border-line pt-4">
                  {isCurrentComplete ? (
                    <Badge tone="success">✓ Completed</Badge>
                  ) : (
                    <form action={completeLessonAction}>
                      <input type="hidden" name="lessonId" value={currentLesson.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <Button type="submit" size="sm">
                        Mark complete
                      </Button>
                    </form>
                  )}
                  {progress.resumeLessonId &&
                  progress.resumeLessonId !== currentLesson.id ? (
                    <ButtonLink
                      href={`/learn/${slug}?lesson=${progress.resumeLessonId}`}
                      variant="ghost"
                      size="sm"
                    >
                      Resume →
                    </ButtonLink>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-10 text-center text-ink-2">
              This course has no lessons yet.
            </Card>
          )}
        </div>

        {/* Curriculum sidebar */}
        <aside>
          <Card className="p-4">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-semibold">
                {progress.progressPercent}% complete
              </span>
              <span className="tnum text-ink-3">
                {progress.completedLessonIds.size}/{orderedLessons.length}
              </span>
            </div>
            <ProgressBar percent={progress.progressPercent} />

            <ul className="mt-4 flex flex-col gap-1">
              {orderedLessons.map((l) => {
                const done = progress.completedLessonIds.has(l.id);
                const active = l.id === currentLesson?.id;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learn/${slug}?lesson=${l.id}`}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${
                        active
                          ? "bg-brand-soft font-medium text-brand-strong"
                          : "text-ink-2 hover:bg-surface-2"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 flex-none place-items-center rounded-full text-[10px] ${
                          done
                            ? "bg-[color:var(--success)] text-white"
                            : "border border-line"
                        }`}
                        aria-hidden
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className="truncate">{l.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>
    </main>
  );
}
