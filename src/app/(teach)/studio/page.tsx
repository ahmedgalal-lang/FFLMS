import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { listInstructorCourses } from "@/server/services/course";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { CreateCourseDialog } from "@/components/course/create-course-dialog";
import { StudioCourseGrid } from "@/components/course/studio-course-grid";

export const metadata: Metadata = { title: "Studio" };

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
        <StudioCourseGrid courses={courses} />
      )}
    </div>
  );
}
