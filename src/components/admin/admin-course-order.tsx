"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { CourseStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reorderCoursesAdminAction } from "@/app/(admin)/admin/actions";

type AdminCourse = {
  id: string;
  title: string;
  status: CourseStatus;
  instructor: { name: string | null };
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

export function AdminCourseOrder({ courses }: { courses: AdminCourse[] }) {
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
      const res = await reorderCoursesAdminAction(ids);
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
      <div className="divide-y rounded-lg border bg-card">
        {courses.map((course, i) => (
          <div
            key={course.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
                  {i + 1}.
                </span>
                <Link
                  href={`/studio/${course.id}`}
                  className="truncate font-medium hover:underline"
                >
                  {course.title}
                </Link>
                <Badge variant={statusVariant[course.status]}>
                  {course.status.toLowerCase().replace("_", " ")}
                </Badge>
              </div>
              <p className="ml-8 mt-1 text-xs text-muted-foreground">
                {course.instructor.name ?? "Unassigned"}
                {course.category && ` · ${course.category.name}`} ·{" "}
                {course._count.modules} modules · {course._count.enrollments}{" "}
                enrolled
              </p>
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
        ))}
      </div>
    </div>
  );
}
