import { env } from "@/config/env";
import { logger } from "@/server/observability";

/**
 * Pluggable transactional email (T076). If RESEND_API_KEY is configured, sends
 * via the Resend HTTP API; otherwise logs the message so flows still work in
 * development without an email provider. Never throws to the caller.
 */
export async function sendEmail(msg: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean }> {
  if (!env.RESEND_API_KEY) {
    logger.info(
      { to: msg.to, subject: msg.subject },
      "email (no provider configured — logged only)",
    );
    // Surface the body in dev logs so links are usable without a provider.
    logger.debug({ text: msg.text ?? msg.html }, "email body");
    return { sent: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    if (!res.ok) {
      logger.error({ status: res.status }, "email provider error");
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    logger.error({ err }, "email send failed");
    return { sent: false };
  }
}

/** Absolute app URL for links in emails. */
export function appUrl(path: string): string {
  const base = (env.APP_URL ?? env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
