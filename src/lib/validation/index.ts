import { z } from "zod";

/**
 * Zod schemas shared across the client/server boundary (Constitution
 * Principle III). Route handlers, server actions, and React Hook Form all
 * validate against these same definitions.
 */

// ---------- Auth ----------

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name is too short").max(100),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters").max(200),
    role: z.enum(["STUDENT", "INSTRUCTOR"]).default("STUDENT"),
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---------- Course ----------

export const courseCreateSchema = z.object({
  title: z.string().min(3, "Title is too short").max(160),
  summary: z.string().min(10, "Add a short summary").max(280),
  description: z.string().max(20_000).optional().default(""),
  categoryId: z.string().cuid().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
});
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;

export const courseUpdateSchema = courseCreateSchema.partial().extend({
  completionThreshold: z.number().int().min(1).max(100).optional(),
  isRequiredSequential: z.boolean().optional(),
});
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;

// ---------- Curriculum ----------

export const moduleCreateSchema = z.object({
  title: z.string().min(2).max(160),
});

export const lessonCreateSchema = z.object({
  moduleId: z.string().cuid(),
  title: z.string().min(2).max(160),
  isRequired: z.boolean().optional().default(true),
  estimatedMinutes: z.number().int().min(0).max(100000).optional().nullable(),
});
export type LessonCreateInput = z.infer<typeof lessonCreateSchema>;

export const contentBlockSchema = z
  .object({
    type: z.enum(["VIDEO", "TEXT", "FILE"]),
    text: z.string().max(50_000).optional().nullable(),
    mediaUrl: z.string().url().optional().nullable(),
    fileName: z.string().max(255).optional().nullable(),
    fileSize: z.number().int().min(0).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "TEXT" && !val.text?.trim()) {
      ctx.addIssue({ code: "custom", message: "Text content is required", path: ["text"] });
    }
    if ((val.type === "VIDEO" || val.type === "FILE") && !val.mediaUrl) {
      ctx.addIssue({ code: "custom", message: "A URL is required", path: ["mediaUrl"] });
    }
  });
export type ContentBlockInput = z.infer<typeof contentBlockSchema>;

export const reorderSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1),
});

// ---------- Enrollment / progress ----------

export const enrollSchema = z.object({
  courseId: z.string().cuid(),
});

export const lessonCompleteSchema = z.object({
  lastPositionSec: z.number().int().min(0).optional(),
});

// ---------- Catalog ----------

export const catalogQuerySchema = z.object({
  q: z.string().max(160).optional(),
  category: z.string().max(160).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

// ---------- Quizzes ----------

export const quizSettingsSchema = z.object({
  title: z.string().min(2).max(160),
  passingScore: z.number().int().min(0).max(100).default(70),
  timeLimitSec: z.number().int().min(0).max(86_400).optional().nullable(),
  maxAttempts: z.number().int().min(1).max(100).optional().nullable(),
  shuffleQuestions: z.boolean().optional().default(false),
  showAnswersAfter: z.boolean().optional().default(true),
});
export type QuizSettingsInput = z.input<typeof quizSettingsSchema>;

export const questionOptionInputSchema = z.object({
  text: z.string().min(1).max(2000),
  isCorrect: z.boolean().default(false),
});

export const questionInputSchema = z
  .object({
    type: z.enum([
      "MULTIPLE_CHOICE",
      "MULTI_SELECT",
      "TRUE_FALSE",
      "SHORT_ANSWER",
    ]),
    prompt: z.string().min(1).max(4000),
    points: z.number().int().min(1).max(100).default(1),
    correctText: z.string().max(2000).optional().nullable(),
    options: z.array(questionOptionInputSchema).max(10).optional().default([]),
  })
  .superRefine((q, ctx) => {
    if (q.type === "SHORT_ANSWER") {
      if (!q.correctText?.trim()) {
        ctx.addIssue({ code: "custom", message: "Provide the accepted answer", path: ["correctText"] });
      }
      return;
    }
    // Choice-based types need options with at least one correct.
    if (q.options.length < 2) {
      ctx.addIssue({ code: "custom", message: "Add at least two options", path: ["options"] });
    }
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (correct < 1) {
      ctx.addIssue({ code: "custom", message: "Mark at least one option correct", path: ["options"] });
    }
    if (q.type === "MULTIPLE_CHOICE" && correct > 1) {
      ctx.addIssue({ code: "custom", message: "Multiple choice allows only one correct option", path: ["options"] });
    }
  });
export type QuestionInput = z.input<typeof questionInputSchema>;

export const submitAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().cuid(),
        selectedOptionIds: z.array(z.string().cuid()).default([]),
        answerText: z.string().max(4000).optional().nullable(),
      }),
    )
    .default([]),
});
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;

// ---------- Assignments ----------

export const assignmentSettingsSchema = z.object({
  title: z.string().min(2).max(160),
  instructions: z.string().max(20_000).optional().default(""),
  dueAt: z.coerce.date().optional().nullable(),
  allowText: z.boolean().optional().default(true),
  allowFile: z.boolean().optional().default(true),
  maxPoints: z.number().int().min(1).max(1000).default(100),
  latePolicy: z.enum(["ACCEPT", "PENALIZE", "REJECT"]).optional().default("ACCEPT"),
});
export type AssignmentSettingsInput = z.input<typeof assignmentSettingsSchema>;

export const submissionInputSchema = z
  .object({
    text: z.string().max(50_000).optional().nullable(),
    fileUrl: z.string().url().optional().nullable(),
    fileName: z.string().max(255).optional().nullable(),
  })
  .refine((s) => !!s.text?.trim() || !!s.fileUrl, {
    message: "Provide a text answer or attach a file.",
  });
export type SubmissionInput = z.infer<typeof submissionInputSchema>;

export const gradeSubmissionSchema = z.object({
  score: z.number().int().min(0),
  feedback: z.string().max(10_000).optional().nullable(),
});
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;

// ---------- Admin ----------

export const changeRoleSchema = z.object({
  role: z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]),
});

export const setStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const rejectCourseSchema = z.object({
  reason: z.string().min(1, "Give a reason").max(2000),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().nullable(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const adminUsersQuerySchema = z.object({
  q: z.string().max(160).optional(),
  role: z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

// ---------- Uploads ----------

export const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(160),
  sizeBytes: z.number().int().min(1),
  prefix: z.string().max(80).optional(),
});
