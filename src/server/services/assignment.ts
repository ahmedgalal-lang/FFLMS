import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";
import {
  assignmentSettingsSchema,
  type AssignmentSettingsInput,
} from "@/lib/validation";

/** Resolve the course that owns a lesson and authorize assignment management. */
async function authorizeLessonAssignment(principal: Principal, lessonId: string) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    select: { id: true, module: { select: { courseId: true } } },
  });
  if (!lesson) throw new NotFoundError("Lesson not found.");
  const course = await loadCourseForAuthz(lesson.module.courseId);
  authorize(principal, { type: "assignment:manage", course });
  return lesson;
}

async function authorizeAssignment(principal: Principal, assignmentId: string) {
  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      lesson: { select: { module: { select: { courseId: true } } } },
    },
  });
  if (!assignment) throw new NotFoundError("Assignment not found.");
  const course = await loadCourseForAuthz(assignment.lesson.module.courseId);
  authorize(principal, { type: "assignment:manage", course });
  return assignment;
}

/** Create or update the assignment attached to a lesson (one per lesson). */
export async function upsertLessonAssignment(
  principal: Principal,
  lessonId: string,
  input: AssignmentSettingsInput,
) {
  await authorizeLessonAssignment(principal, lessonId);
  const data = assignmentSettingsSchema.parse(input);
  return db.assignment.upsert({
    where: { lessonId },
    update: {
      title: data.title,
      instructions: data.instructions ?? "",
      dueAt: data.dueAt ?? null,
      allowText: data.allowText ?? true,
      allowFile: data.allowFile ?? true,
      maxPoints: data.maxPoints,
      latePolicy: data.latePolicy ?? "ACCEPT",
    },
    create: {
      lessonId,
      title: data.title,
      instructions: data.instructions ?? "",
      dueAt: data.dueAt ?? null,
      allowText: data.allowText ?? true,
      allowFile: data.allowFile ?? true,
      maxPoints: data.maxPoints,
      latePolicy: data.latePolicy ?? "ACCEPT",
    },
  });
}

export async function deleteAssignment(
  principal: Principal,
  assignmentId: string,
) {
  await authorizeAssignment(principal, assignmentId);
  await db.assignment.delete({ where: { id: assignmentId } });
}

/** Lesson (with its assignment, if any) for the instructor authoring page. */
export async function getLessonAssignmentForEditing(
  principal: Principal,
  lessonId: string,
) {
  const lesson = await authorizeLessonAssignment(principal, lessonId);
  return db.lesson.findUnique({
    where: { id: lesson.id },
    select: {
      id: true,
      title: true,
      module: { select: { courseId: true } },
      assignment: true,
    },
  });
}
