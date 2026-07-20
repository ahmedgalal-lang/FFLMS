import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError, AppError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";
import {
  submissionInputSchema,
  gradeSubmissionSchema,
  type SubmissionInput,
  type GradeSubmissionInput,
} from "@/lib/validation";

/**
 * Submit (or resubmit) an assignment as the acting student. Late status is
 * computed with server time; the REJECT late policy blocks past-due submissions
 * (FR-020). One submission row per (assignment, student) — resubmitting updates.
 */
export async function submitAssignment(
  principal: Principal,
  assignmentId: string,
  input: SubmissionInput,
) {
  const data = submissionInputSchema.parse(input);

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      dueAt: true,
      allowText: true,
      allowFile: true,
      latePolicy: true,
      lesson: { select: { module: { select: { courseId: true } } } },
    },
  });
  if (!assignment) throw new NotFoundError("Assignment not found.");
  const courseId = assignment.lesson.module.courseId;

  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: principal.id, courseId } },
    select: { id: true, studentId: true },
  });
  if (!enrollment) {
    throw new AppError("Enrol in the course to submit this assignment.", 403, "NOT_ENROLLED");
  }
  authorize(principal, {
    type: "assignment:submit",
    enrollment: { studentId: enrollment.studentId },
  });

  if (data.text?.trim() && !assignment.allowText) {
    throw new AppError("This assignment does not accept text answers.", 422, "TEXT_NOT_ALLOWED");
  }
  if (data.fileUrl && !assignment.allowFile) {
    throw new AppError("This assignment does not accept file uploads.", 422, "FILE_NOT_ALLOWED");
  }

  const now = new Date();
  const isLate = assignment.dueAt ? now > assignment.dueAt : false;
  if (isLate && assignment.latePolicy === "REJECT") {
    throw new AppError("The deadline has passed; late submissions are not accepted.", 422, "PAST_DUE");
  }

  return db.submission.upsert({
    where: {
      assignmentId_studentId: { assignmentId, studentId: principal.id },
    },
    update: {
      text: data.text ?? null,
      fileUrl: data.fileUrl ?? null,
      isLate,
      status: "SUBMITTED",
      submittedAt: now,
      // Clear any prior grade on resubmission.
      score: null,
      feedback: null,
      gradedById: null,
      gradedAt: null,
    },
    create: {
      assignmentId,
      studentId: principal.id,
      enrollmentId: enrollment.id,
      text: data.text ?? null,
      fileUrl: data.fileUrl ?? null,
      isLate,
      status: "SUBMITTED",
      submittedAt: now,
    },
  });
}

/** Grade a submission as the owning course's instructor (FR-021). */
export async function gradeSubmission(
  principal: Principal,
  submissionId: string,
  input: GradeSubmissionInput,
) {
  const data = gradeSubmissionSchema.parse(input);

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      studentId: true,
      assignment: {
        select: {
          maxPoints: true,
          title: true,
          lesson: { select: { module: { select: { courseId: true } } } },
        },
      },
    },
  });
  if (!submission) throw new NotFoundError("Submission not found.");

  const course = await loadCourseForAuthz(
    submission.assignment.lesson.module.courseId,
  );
  authorize(principal, { type: "assignment:grade", course });

  if (data.score > submission.assignment.maxPoints) {
    throw new AppError(
      `Score cannot exceed the maximum of ${submission.assignment.maxPoints}.`,
      422,
      "SCORE_TOO_HIGH",
    );
  }

  const graded = await db.submission.update({
    where: { id: submissionId },
    data: {
      score: data.score,
      feedback: data.feedback ?? null,
      status: "GRADED",
      gradedById: principal.id,
      gradedAt: new Date(),
    },
  });

  // Notify the student their submission was graded.
  await db.notification
    .create({
      data: {
        userId: submission.studentId,
        type: "GRADE_POSTED",
        title: "Assignment graded",
        body: `Your submission for "${submission.assignment.title}" scored ${data.score}/${submission.assignment.maxPoints}.`,
      },
    })
    .catch(() => undefined);

  return graded;
}

/** All submissions for an assignment — instructor grading queue. */
export async function listSubmissions(
  principal: Principal,
  assignmentId: string,
) {
  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      maxPoints: true,
      lesson: { select: { module: { select: { courseId: true } } } },
    },
  });
  if (!assignment) throw new NotFoundError("Assignment not found.");
  const course = await loadCourseForAuthz(
    assignment.lesson.module.courseId,
  );
  authorize(principal, { type: "assignment:grade", course });

  const submissions = await db.submission.findMany({
    where: { assignmentId },
    orderBy: { submittedAt: "asc" },
    include: { student: { select: { name: true, email: true } } },
  });
  return { assignment, submissions };
}

/** The acting student's own submission for an assignment (or null). */
export async function getMySubmission(
  principal: Principal,
  assignmentId: string,
) {
  return db.submission.findUnique({
    where: {
      assignmentId_studentId: { assignmentId, studentId: principal.id },
    },
  });
}
