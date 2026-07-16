import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { currentActor } from "@/server/auth";
import { listInstructorCourses } from "@/server/services/course";

export const metadata: Metadata = { title: "Studio" };

const statusTone = {
  DRAFT: "neutral",
  IN_REVIEW: "warning",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
} as const;

export default async function StudioPage() {
  const actor = await currentActor();
  const courses = await listInstructorCourses(actor);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Studio</h1>
          <p className="mt-1 text-ink-2">Create and manage your courses.</p>
        </div>
        <ButtonLink href="/studio/new">+ New course</ButtonLink>
      </div>

      {courses.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <p className="text-ink-2">No courses yet. Create your first one.</p>
          <ButtonLink href="/studio/new" className="mt-4">
            + New course
          </ButtonLink>
        </Card>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/studio/${c.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:border-brand">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold tracking-tight">{c.title}</h2>
                    <Badge tone={statusTone[c.status]}>
                      {c.status.replace("_", " ").toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-3">
                    {c.category?.name ?? "Uncategorized"} ·{" "}
                    <span className="tnum">{c._count.enrollments}</span> enrolled
                  </p>
                </div>
                <span className="text-ink-3">Edit →</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
