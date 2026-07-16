import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink, Card, ProgressBar, Badge } from "@/components/ui";
import { currentActor } from "@/server/auth";
import { listMyEnrollments } from "@/server/services/enrollment";

export const metadata: Metadata = { title: "My Learning" };

export default async function MyLearningPage() {
  const actor = await currentActor();
  if (!actor) redirect("/sign-in");
  const enrollments = await listMyEnrollments(actor);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">My Learning</h1>
      <p className="mt-1 text-ink-2">
        {enrollments.length} enrolled course{enrollments.length === 1 ? "" : "s"}
      </p>

      {enrollments.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <p className="text-ink-2">You haven&rsquo;t enrolled in anything yet.</p>
          <ButtonLink href="/courses" className="mt-4">
            Browse the catalog
          </ButtonLink>
        </Card>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {enrollments.map((e) => (
            <Card key={e.id} className="flex flex-col p-5">
              <div className="mb-2 flex items-center justify-between">
                {e.course.category ? (
                  <Badge tone="brand">{e.course.category.name}</Badge>
                ) : (
                  <span />
                )}
                {e.status === "COMPLETED" ? (
                  <Badge tone="success">Completed</Badge>
                ) : (
                  <Badge tone="warning">In progress</Badge>
                )}
              </div>
              <h2 className="font-semibold tracking-tight text-balance">
                {e.course.title}
              </h2>
              <p className="mt-1 text-sm text-ink-3">
                {e.course.instructor.name}
              </p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold">{e.progressPercent}% complete</span>
                </div>
                <ProgressBar percent={e.progressPercent} />
              </div>
              <ButtonLink
                href={`/learn/${e.course.slug}`}
                variant="secondary"
                className="mt-4"
              >
                {e.progressPercent > 0 ? "Continue" : "Start"}
              </ButtonLink>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
