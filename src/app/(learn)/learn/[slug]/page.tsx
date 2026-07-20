import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { loadPlayer } from "@/server/services/player";
import { NotFoundError } from "@/server/http";
import { CoursePlayer } from "@/components/course/course-player";

export const metadata: Metadata = { title: "Learning" };

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { slug } = await params;
  const { lesson } = await searchParams;
  const principal = await requirePrincipal();

  try {
    const data = await loadPlayer(principal, slug, lesson);
    return (
      <CoursePlayer
        slug={slug}
        course={data.course}
        completedIds={[...data.completedIds]}
        currentLesson={data.currentLesson}
        mySubmission={data.mySubmission}
        progressPercent={data.enrollment.progressPercent}
      />
    );
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}
