import { randomBytes } from "crypto";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { sendEmail, appUrl } from "@/server/email/send";
import { AppError } from "@/server/http";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const IDENTIFIER_PREFIX = "pwreset:";

/**
 * Request a password reset. Always resolves successfully (never reveals whether
 * an account exists). If the email maps to a credentials account, a one-hour
 * token is created and a reset link emailed (or logged if no email provider).
 */
export async function requestPasswordReset(email: string) {
  const normalized = email.toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalized },
    select: { id: true, passwordHash: true },
  });
  if (!user || !user.passwordHash) return; // silent no-op

  const token = randomBytes(32).toString("hex");
  const identifier = `${IDENTIFIER_PREFIX}${normalized}`;
  // Replace any existing reset token for this identifier.
  await db.verificationToken.deleteMany({ where: { identifier } });
  await db.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + RESET_TTL_MS) },
  });

  const link = appUrl(
    `/reset-password?email=${encodeURIComponent(normalized)}&token=${token}`,
  );
  await sendEmail({
    to: normalized,
    subject: "Reset your LMS password",
    text: `Reset your password using this link (valid 1 hour): ${link}`,
    html: `<p>Reset your password using the link below (valid for 1 hour):</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  });
}

/** Complete a password reset with a valid, unexpired token. */
export async function resetPassword(input: ResetPasswordInput) {
  const data = resetPasswordSchema.parse(input);
  const identifier = `${IDENTIFIER_PREFIX}${data.email.toLowerCase()}`;

  const record = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: data.token } },
  });
  if (!record || record.expires < new Date()) {
    throw new AppError("This reset link is invalid or has expired.", 422, "BAD_TOKEN");
  }

  const user = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true },
  });
  if (!user) throw new AppError("Account not found.", 404, "NOT_FOUND");

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(data.password) },
    }),
    db.verificationToken.deleteMany({ where: { identifier } }),
  ]);
  return { ok: true };
}
