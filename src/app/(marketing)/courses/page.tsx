import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchCatalog, listCategories } from "@/server/services/catalog";
import { catalogQuerySchema } from "@/lib/validation";
import { parsePagination, pageMeta } from "@/server/http";
import { CourseCard } from "@/components/course/course-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Course catalog" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const query = catalogQuerySchema.parse({
    q: sp.q,
    category: sp.category,
    page: sp.page,
  });
  const pagination = parsePagination(
    new URLSearchParams({ page: String(query.page ?? 1) }),
  );
  const [{ items, total }, categories] = await Promise.all([
    searchCatalog(query, pagination),
    listCategories(),
  ]);
  const meta = pageMeta(total, pagination);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course catalog</h1>
        <p className="text-sm text-muted-foreground">
          {total} published {total === 1 ? "course" : "courses"}
        </p>
      </div>

      <form className="flex flex-wrap gap-2" action="/courses">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Search courses…"
            className="pl-9"
            aria-label="Search courses"
          />
        </div>
        <select
          name="category"
          defaultValue={query.category ?? ""}
          aria-label="Filter by category"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit">Search</Button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No courses match your search.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (query.q) params.set("q", query.q);
            if (query.category) params.set("category", query.category);
            params.set("page", String(p));
            return (
              <Button
                key={p}
                asChild
                variant={p === meta.page ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/courses?${params.toString()}`}>{p}</Link>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
