import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Button, ButtonLink, Card } from "@/components/ui";
import { currentActor } from "@/server/auth";
import { getCourseForEditor } from "@/server/services/course";
import { getPublishReadiness } from "@/server/services/publish";
import {
  addModuleAction,
  addLessonAction,
  addContentBlockAction,
  publishCourseAction,
  unpublishCourseAction,
} from "../actions";

export const metadata: Metadata = { title: "Course builder" };

const statusTone = {
  DRAFT: "neutral",
  IN_REVIEW: "warning",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
} as const;

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const actor = await currentActor();
  const course = await getCourseForEditor(actor, courseId);
  if (!course) notFound();
  const readiness = await getPublishReadiness(actor, courseId);
  const ready = readiness.every((r) => r.ok);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/studio" className="text-sm text-ink-3 hover:text-ink">
        ← Studio
      </Link>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          <Badge tone={statusTone[course.status]}>
            {course.status.replace("_", " ").toLowerCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {course.status === "PUBLISHED" ? (
            <>
              <ButtonLink
                href={`/courses/${course.slug}`}
                variant="secondary"
                size="sm"
              >
                View live
              </ButtonLink>
              <form action={unpublishCourseAction}>
                <input type="hidden" name="courseId" value={course.id} />
                <Button variant="ghost" size="sm">
                  Unpublish
                </Button>
              </form>
            </>
          ) : (
            <form action={publishCourseAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <Button size="sm" disabled={!ready}>
                Publish course
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Curriculum */}
        <div className="flex flex-col gap-4">
          {course.modules.length === 0 ? (
            <Card className="p-6 text-center text-ink-2">
              No modules yet. Add your first module to start building.
            </Card>
          ) : (
            course.modules.map((m, i) => (
              <Card key={m.id} className="overflow-hidden">
                <div className="border-b border-line bg-surface-2 px-4 py-3 text-sm font-semibold">
                  {i + 1}. {m.title}
                </div>
                <div className="flex flex-col gap-3 p-4">
                  {m.lessons.map((l) => (
                    <div
                      key={l.id}
                      className="rounded-lg border border-line p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{l.title}</span>
                        <span className="tnum text-xs text-ink-3">
                          {l.contentBlocks.length} block
                          {l.contentBlocks.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      {l.contentBlocks.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {l.contentBlocks.map((b) => (
                            <li key={b.id}>
                              <Badge tone="brand">{b.type.toLowerCase()}</Badge>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <AddContentForm courseId={course.id} lessonId={l.id} />
                    </div>
                  ))}

                  <form
                    action={addLessonAction}
                    className="flex gap-2 pt-1"
                  >
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={m.id} />
                    <input
                      name="title"
                      required
                      placeholder="New lesson title"
                      className="flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
                    />
                    <Button variant="secondary" size="sm">
                      + Lesson
                    </Button>
                  </form>
                </div>
              </Card>
            ))
          )}

          <Card className="p-4">
            <form action={addModuleAction} className="flex gap-2">
              <input type="hidden" name="courseId" value={course.id} />
              <input
                name="title"
                required
                placeholder="New module title"
                className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <Button size="sm">+ Module</Button>
            </form>
          </Card>
        </div>

        {/* Publish readiness */}
        <aside>
          <Card className="sticky top-6 p-5">
            <h2 className="text-sm font-semibold">Publish readiness</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {readiness.map((r) => (
                <li key={r.key} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={`mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full text-[10px] ${
                      r.ok
                        ? "bg-[color:var(--success)] text-white"
                        : "border border-line text-ink-3"
                    }`}
                    aria-hidden
                  >
                    {r.ok ? "✓" : ""}
                  </span>
                  <span className={r.ok ? "text-ink-2" : "text-ink"}>
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-3">
              {ready
                ? "All checks pass — you can publish."
                : "Complete every check to publish this course."}
            </p>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function AddContentForm({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-medium text-brand-strong">
        + Add content
      </summary>
      <form
        action={addContentBlockAction}
        className="mt-2 flex flex-col gap-2 rounded-lg bg-surface-2 p-3"
      >
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        <select
          name="type"
          defaultValue="TEXT"
          aria-label="Content type"
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand"
        >
          <option value="TEXT">Text</option>
          <option value="VIDEO">Video (embed URL)</option>
          <option value="FILE">File (URL)</option>
        </select>
        <input
          name="text"
          placeholder="Text content (for Text blocks)"
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand"
        />
        <input
          name="mediaUrl"
          placeholder="Media/File URL (for Video/File)"
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand"
        />
        <input
          name="fileName"
          placeholder="File name (for File)"
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand"
        />
        <Button variant="secondary" size="sm" type="submit">
          Add block
        </Button>
      </form>
    </details>
  );
}
