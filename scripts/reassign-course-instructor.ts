/**
 * One-time maintenance: move every course owned by REASSIGN_COURSES_FROM_EMAIL
 * to REASSIGN_COURSES_TO_EMAIL. No-ops silently unless both env vars are set,
 * and never throws — this runs before `next start` on boot and must not be
 * able to block the app from starting. Remove the env vars once confirmed;
 * this script is safe to delete afterward (see runtime logs for confirmation).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const fromEmail = process.env.REASSIGN_COURSES_FROM_EMAIL;
  const toEmail = process.env.REASSIGN_COURSES_TO_EMAIL;
  if (!fromEmail || !toEmail) {
    console.log("[reassign-course-instructor] skipped (env vars not set)");
    return;
  }

  const [from, to] = await Promise.all([
    db.user.findUnique({ where: { email: fromEmail } }),
    db.user.findUnique({ where: { email: toEmail } }),
  ]);
  if (!from) {
    console.log(`[reassign-course-instructor] source user not found: ${fromEmail}`);
    return;
  }
  if (!to) {
    console.log(`[reassign-course-instructor] target user not found: ${toEmail}`);
    return;
  }

  const result = await db.course.updateMany({
    where: { instructorId: from.id },
    data: { instructorId: to.id },
  });
  console.log(
    `[reassign-course-instructor] moved ${result.count} course(s) from ${fromEmail} to ${toEmail}`,
  );
}

main()
  .catch((err) => {
    console.error("[reassign-course-instructor] failed (non-fatal):", err);
  })
  .finally(() => db.$disconnect());
