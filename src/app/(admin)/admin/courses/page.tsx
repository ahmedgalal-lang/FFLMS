import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { listAllCourses } from "@/server/services/course";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminCourseOrder } from "@/components/admin/admin-course-order";

export const metadata: Metadata = { title: "Courses · Admin" };

export default async function AdminCoursesPage() {
  const principal = await requirePrincipal();
  const courses = await listAllCourses(principal);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="text-sm text-muted-foreground">
          Arrange the order students should take courses in — first course
          first. Applies across every instructor.
        </p>
      </div>
      <AdminNav />
      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No courses yet.
        </div>
      ) : (
        <AdminCourseOrder courses={courses} />
      )}
    </div>
  );
}
