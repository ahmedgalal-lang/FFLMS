import Link from "next/link";
import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { loadCourseForAuthz } from "@/server/services/course";
import { listCourseAssignments } from "@/server/services/course-assignment";
import { AssignPanel } from "@/components/course/assign-panel";

export const metadata: Metadata = { title: "Assign students" };

export default async function AssignStudentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const principal = await requirePrincipal();
  const course = await loadCourseForAuthz(courseId);
  const assignments = await listCourseAssignments(principal, courseId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/studio/${courseId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Assign students</h1>
        <p className="text-sm text-muted-foreground">
          This course is Restricted — only directly assigned students, or
          students in a group this course is assigned to, can access it.
        </p>
      </div>

      <AssignPanel
        courseId={courseId}
        courseStatus={course.status}
        assignments={assignments.map((a) => ({
          studentId: a.studentId,
          name: a.student.name,
          email: a.student.email,
          assignedAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
