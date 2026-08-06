"use server";

import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/server/auth";
import { revokeCertificate, reinstateCertificate } from "@/server/services/certificate";
import { AppError, NotFoundError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";

export type CertificateActionState = { error?: string; ok?: boolean } | undefined;

function toState(err: unknown): CertificateActionState {
  if (err instanceof AuthorizationError) return { error: err.message };
  if (err instanceof AppError) return { error: err.message };
  if (err instanceof NotFoundError) return { error: err.message };
  return { error: "Something went wrong. Please try again." };
}

export async function revokeCertificateAction(
  courseId: string,
  certificateId: string,
): Promise<CertificateActionState> {
  const principal = await requirePrincipal();
  try {
    await revokeCertificate(principal, certificateId);
    revalidatePath(`/studio/${courseId}/certificates`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}

export async function reinstateCertificateAction(
  courseId: string,
  certificateId: string,
): Promise<CertificateActionState> {
  const principal = await requirePrincipal();
  try {
    await reinstateCertificate(principal, certificateId);
    revalidatePath(`/studio/${courseId}/certificates`);
    return { ok: true };
  } catch (err) {
    return toState(err);
  }
}
