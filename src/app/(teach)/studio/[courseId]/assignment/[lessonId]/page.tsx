import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { getLessonAssignmentForEditing } from "@/server/services/assignment";
import { listSubmissions } from "@/server/services/submission";
import { AssignmentBuilder } from "@/components/assignment/assignment-builder";

export const metadata: Metadata = { title: "Assignment" };

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const principal = await requirePrincipal();
  const lesson = await getLessonAssignmentForEditing(principal, lessonId);
  if (!lesson) notFound();

  const grading = lesson.assignment
    ? await listSubmissions(principal, lesson.assignment.id)
    : null;

  return (
    <AssignmentBuilder
      courseId={courseId}
      lessonId={lessonId}
      lessonTitle={lesson.title}
      assignment={lesson.assignment}
      submissions={grading?.submissions ?? []}
      maxPoints={lesson.assignment?.maxPoints ?? 100}
    />
  );
}
