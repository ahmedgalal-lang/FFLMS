import { z } from "zod";

export const courseInputSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(160),
  summary: z.string().min(1, "Add a short summary").max(300),
  description: z.string().min(1, "Add a description"),
  categoryId: z.string().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal("")),
});
export type CourseInput = z.infer<typeof courseInputSchema>;

export const moduleInputSchema = z.object({
  title: z.string().min(1, "Module needs a title").max(160),
});

export const lessonInputSchema = z.object({
  title: z.string().min(1, "Lesson needs a title").max(160),
  isRequired: z.boolean().optional().default(true),
});

export const contentBlockSchema = z.object({
  type: z.enum(["VIDEO", "TEXT", "FILE"]),
  text: z.string().optional().nullable(),
  mediaUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
});
export type ContentBlockInput = z.infer<typeof contentBlockSchema>;
