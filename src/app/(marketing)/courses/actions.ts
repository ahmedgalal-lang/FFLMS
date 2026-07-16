"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePrincipal, getPrincipal } from "@/server/auth";
import { enroll } from "@/server/services/enrollment";
import { AppError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type EnrollState = { error?: string } | undefined;

export async function enrollAction(
  courseId: string,
  courseSlug: string,
): Promise<EnrollState> {
  const principal = await getPrincipal();
  if (!principal) {
    redirect(`/sign-in?callbackUrl=/courses/${courseSlug}`);
  }
  try {
    await requirePrincipal();
    await enroll(principal, courseId);
  } catch (err) {
    if (err instanceof AuthorizationError) return { error: err.message };
    if (err instanceof AppError) return { error: err.message };
    return { error: "Could not enrol. Please try again." };
  }
  revalidatePath("/my-learning");
  redirect(`/learn/${courseSlug}`);
}
