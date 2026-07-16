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

// ---------- Uploads ----------

export const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(160),
  sizeBytes: z.number().int().min(1),
  prefix: z.string().max(80).optional(),
});
