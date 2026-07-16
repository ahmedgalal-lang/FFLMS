import { ButtonLink, Card } from "@/components/ui";
import { listCatalog } from "@/server/services/catalog";
import { CourseCard } from "@/components/course-card";

export default async function LandingPage() {
  const { items } = await listCatalog({ page: 1 });
  const featured = items.slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-5">
      <section className="py-16 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-strong">
          Learn without limits
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
          Author great courses. Learn with tracked progress.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-2">
          A Learning Management System where instructors build and publish
          courses, and students enroll, learn, and see their progress advance.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <ButtonLink href="/courses">Browse the catalog</ButtonLink>
          <ButtonLink href="/register" variant="secondary">
            Start teaching
          </ButtonLink>
        </div>
      </section>

      <section className="pb-20">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Featured courses
          </h2>
          <ButtonLink href="/courses" variant="ghost" size="sm">
            See all →
          </ButtonLink>
        </div>
        {featured.length === 0 ? (
          <Card className="p-10 text-center text-ink-2">
            No published courses yet. Sign in as an instructor to create one.
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
