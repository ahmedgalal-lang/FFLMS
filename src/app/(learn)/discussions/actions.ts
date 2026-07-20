"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePrincipal } from "@/server/auth";
import { createThread, addPost } from "@/server/services/discussion";
import { createAnnouncement } from "@/server/services/announcement";
import {
  threadCreateSchema,
  postCreateSchema,
  announcementCreateSchema,
} from "@/lib/validation";
import { AppError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type DiscussionState = { error?: string; ok?: boolean } | undefined;

function toState(err: unknown): DiscussionState {
  if (err instanceof AuthorizationError) return { error: err.message };
  if (err instanceof AppError) return { error: err.message };
  return { error: "Something went wrong. Please try again." };
}

export async function createThreadAction(
  slug: string,
  input: unknown,
): Promise<DiscussionState> {
  const principal = await requirePrincipal();
  const parsed = threadCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid." };
  let thread;
  try {
    thread = await createThread(principal, parsed.data);
  } catch (err) {
    return toState(err);
  }
  redirect(`/discussions/${thread.id}`);
}

export async function addPostAction(
  threadId: string,
  body: string,
): Promise<DiscussionState> {
  const principal = await requirePrincipal();
  const parsed = postCreateSchema.safeParse({ threadId, body });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid." };
  try {
    await addPost(principal, parsed.data);
    revalidatePath(`/discussions/${threadId}`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function createAnnouncementAction(
  slug: string,
  input: unknown,
): Promise<DiscussionState> {
  const principal = await requirePrincipal();
  const parsed = announcementCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid." };
  try {
    await createAnnouncement(principal, parsed.data);
    revalidatePath(`/learn/${slug}/discussions`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}
