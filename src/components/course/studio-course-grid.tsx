"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { CourseStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reorderCoursesAction } from "@/app/(teach)/studio/actions";

type StudioCourse = {
  id: string;
  title: string;
  summary: string;
  status: CourseStatus;
  category: { name: string } | null;
  _count: { modules: number; enrollments: number };
};

const statusVariant: Record<
  CourseStatus,
  "default" | "secondary" | "success" | "warning"
> = {
  DRAFT: "secondary",
  IN_REVIEW: "warning",
  PUBLISHED: "success",
  ARCHIVED: "secondary",
};

export function StudioCourseGrid({ courses }: { courses: StudioCourse[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= courses.length) return;
    const ids = courses.map((c) => c.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    setError(null);
    startTransition(async () => {
      const res = await reorderCoursesAction(ids);
      if (res && "error" in res && res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        This order controls the sequence students see across the catalog and
        My Learning — first course first.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, i) => (
          <div
            key={course.id}
            className="rounded-lg border bg-card p-5 transition-colors hover:border-primary"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/studio/${course.id}`}
                className="font-semibold leading-tight hover:underline"
              >
                {course.title}
              </Link>
              <Badge variant={statusVariant[course.status]}>
                {course.status.toLowerCase().replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {course.summary}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{course._count.modules} modules</span>
                <span>{course._count.enrollments} enrolled</span>
                {course.category && <span>{course.category.name}</span>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Move ${course.title} up`}
                  disabled={pending || i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Move ${course.title} down`}
                  disabled={pending || i === courses.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
