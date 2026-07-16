import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { CourseCard } from "@/components/course-card";
import { listCatalog, listCategories } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Course catalog" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const [{ items, total, pageSize }, categories] = await Promise.all([
    listCatalog({ q: sp.q, categorySlug: sp.category, page }),
    listCategories(),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Course catalog</h1>
      <p className="mt-1 text-ink-2">
        {total} published course{total === 1 ? "" : "s"}
      </p>

      <form className="mt-6 flex flex-wrap gap-3" role="search">
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search courses…"
          aria-label="Search courses"
          className="min-w-56 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <select
          name="category"
          defaultValue={sp.category ?? ""}
          aria-label="Filter by category"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-strong">
          Search
        </button>
      </form>

      {items.length === 0 ? (
        <Card className="mt-8 p-10 text-center text-ink-2">
          No courses match your search.
        </Card>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
            const params = new URLSearchParams();
            if (sp.q) params.set("q", sp.q);
            if (sp.category) params.set("category", sp.category);
            params.set("page", String(n));
            return (
              <Link
                key={n}
                href={`/courses?${params.toString()}`}
                aria-current={n === page ? "page" : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm tnum ${
                  n === page
                    ? "border-transparent bg-brand text-brand-ink"
                    : "border-line bg-surface text-ink-2 hover:border-ink-3"
                }`}
              >
                {n}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </main>
  );
}
