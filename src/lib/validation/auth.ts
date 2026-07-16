import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().min(2, "Enter your name").max(120),
  role: z.enum(["INSTRUCTOR", "STUDENT"]).optional().default("STUDENT"),
});
export type RegisterInput = z.infer<typeof registerSchema>;
