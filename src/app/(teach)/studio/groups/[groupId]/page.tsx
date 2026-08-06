import Link from "next/link";
import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { getGroup } from "@/server/services/group";
import { listInstructorCourses } from "@/server/services/course";
import { GroupDetail } from "@/components/course/group-detail";

export const metadata: Metadata = { title: "Group" };

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const principal = await requirePrincipal();
  const [{ group, memberships, courseAssignments }, courses] = await Promise.all([
    getGroup(principal, groupId),
    listInstructorCourses(principal),
  ]);

  const assignedCourseIds = new Set(courseAssignments.map((a) => a.courseId));
  const assignableCourses = courses.filter(
    (c) =>
      c.status === "PUBLISHED" &&
      c.visibility === "RESTRICTED" &&
      !assignedCourseIds.has(c.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/studio/groups"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← All groups
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{group.name}</h1>
      </div>

      <GroupDetail
        groupId={groupId}
        members={memberships.map((m) => ({
          studentId: m.studentId,
          name: m.student.name,
          email: m.student.email,
        }))}
        assignedCourses={courseAssignments.map((a) => ({
          courseId: a.courseId,
          title: a.course.title,
        }))}
        assignableCourses={assignableCourses.map((c) => ({
          id: c.id,
          title: c.title,
        }))}
      />
    </div>
  );
}
