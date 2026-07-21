"use server";

import { registerUser } from "@/server/services/account";
import { signIn } from "@/server/auth";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import {
  requestPasswordReset,
  resetPassword,
} from "@/server/services/password-reset";
import { AppError } from "@/server/http";
import { bestEffort } from "@/server/observability";

export type AuthFormState = { error?: string; ok?: boolean } | undefined;

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") ?? "STUDENT",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  try {
    await registerUser(parsed.data);
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    return { error: "Could not create your account. Please try again." };
  }

  // Sign the new user in and redirect to their dashboard.
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
  return undefined;
}

export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email." };
  // Always succeed (don't reveal whether the account exists).
  await bestEffort("password-reset-request", () =>
    requestPasswordReset(parsed.data.email),
  );
  return { ok: true } as AuthFormState;
}

export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }
  try {
    await resetPassword(parsed.data);
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    return { error: "Could not reset your password." };
  }
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
  return undefined;
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    // next-auth throws a redirect on success; re-throw those.
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    return { error: "Invalid email or password." };
  }
  return undefined;
}
