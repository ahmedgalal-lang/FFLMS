import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { listInstructorCourses } from "@/server/services/course";
import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateCourseDialog } from "@/components/course/create-course-dialog";
import type { CourseStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Studio" };

const statusVariant: Record<
  CourseStatus,
  "default" | "secondary" | "success" | "warning"
> = {
  DRAFT: "secondary",
  IN_REVIEW: "warning",
  PUBLISHED: "success",
  ARCHIVED: "secondary",
};

export default async function StudioPage() {
  const principal = await requirePrincipal();
  const [courses, categories, instructors] = await Promise.all([
    listInstructorCourses(principal),
    db.category.findMany({ orderBy: { name: "asc" } }),
    principal.role === "ADMIN"
      ? db.user.findMany({
          where: { role: "INSTRUCTOR", status: "ACTIVE" },
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your courses</h1>
          <p className="text-sm text-muted-foreground">
            Create, structure, and publish courses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/studio/groups">
              <Users /> Groups
            </Link>
          </Button>
          <CreateCourseDialog categories={categories} instructors={instructors} />
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            You haven&apos;t created any courses yet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use “New course” to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/studio/${course.id}`}
              className="rounded-lg border bg-card p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold leading-tight">{course.title}</h2>
                <Badge variant={statusVariant[course.status]}>
                  {course.status.toLowerCase().replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {course.summary}
              </p>
              <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                <span>{course._count.modules} modules</span>
                <span>{course._count.enrollments} enrolled</span>
                {course.category && <span>{course.category.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
