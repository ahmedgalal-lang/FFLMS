import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError } from "@/server/http";
import { loadCourseForAuthz } from "@/server/services/course";
import {
  announcementCreateSchema,
  type AnnouncementCreateInput,
} from "@/lib/validation";
import { notifyMany } from "@/server/services/notification";

/**
 * Instructor announcements (FR-029). Publishing fans out a notification to
 * every enrolled student in the course.
 */
export async function createAnnouncement(
  principal: Principal,
  input: AnnouncementCreateInput,
) {
  const data = announcementCreateSchema.parse(input);
  const course = await loadCourseForAuthz(data.courseId);
  authorize(principal, { type: "announcement:create", course });
  const slugRow = await db.course.findUnique({
    where: { id: data.courseId },
    select: { slug: true },
  });

  const announcement = await db.announcement.create({
    data: {
      courseId: data.courseId,
      authorId: principal.id,
      title: data.title,
      body: data.body,
    },
  });

  const enrollments = await db.enrollment.findMany({
    where: { courseId: data.courseId, status: { not: "CANCELLED" } },
    select: { studentId: true },
  });
  await notifyMany(
    enrollments.map((e) => e.studentId),
    {
      type: "ANNOUNCEMENT",
      title: `Announcement: ${data.title}`,
      body: data.body.slice(0, 200),
      linkUrl: `/learn/${slugRow?.slug ?? ""}`,
    },
  );

  return announcement;
}

export async function listAnnouncements(courseId: string) {
  return db.announcement.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });
}

/** Announcements visible to an enrolled student (used in the player). */
export async function listAnnouncementsForStudent(
  principal: Principal,
  courseId: string,
) {
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId: principal.id, courseId } },
    select: { id: true },
  });
  if (!enrollment) throw new NotFoundError("You are not enrolled in this course.");
  return listAnnouncements(courseId);
}
