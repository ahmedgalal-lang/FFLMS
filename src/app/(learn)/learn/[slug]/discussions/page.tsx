import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { requirePrincipal } from "@/server/auth";
import { db } from "@/server/db";
import { listThreads } from "@/server/services/discussion";
import { listAnnouncements } from "@/server/services/announcement";
import { NotFoundError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";
import { DiscussionBoard } from "@/components/discussion/discussion-board";

export const metadata: Metadata = { title: "Discussion" };

export default async function CourseDiscussionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const principal = await requirePrincipal();

  const course = await db.course.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, title: true, instructorId: true },
  });
  if (!course) notFound();

  try {
    const [threads, announcements] = await Promise.all([
      listThreads(principal, course.id),
      listAnnouncements(course.id),
    ]);
    const isInstructor = course.instructorId === principal.id;

    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href={`/learn/${slug}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to course
        </Link>
        <h1 className="text-2xl font-bold">{course.title} · Discussion</h1>
        <DiscussionBoard
          slug={slug}
          courseId={course.id}
          isInstructor={isInstructor}
          threads={threads}
          announcements={announcements}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthorizationError || err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }
}
