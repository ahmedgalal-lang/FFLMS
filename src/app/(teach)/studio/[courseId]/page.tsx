import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { db } from "@/server/db";
import { getCourseForEditing } from "@/server/services/course";
import { getPublishReadiness } from "@/server/services/publish";
import { isVideoUploadEnabled } from "@/server/services/media";
import { CourseBuilder } from "@/components/course/course-builder";

export const metadata: Metadata = { title: "Course builder" };

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const principal = await requirePrincipal();
  const course = await getCourseForEditing(principal, courseId);
  if (!course) notFound();
  const [readiness, categories] = await Promise.all([
    getPublishReadiness(principal, courseId),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <CourseBuilder
      course={course}
      publishProblems={readiness}
      categories={categories}
      videoUploadEnabled={isVideoUploadEnabled()}
    />
  );
}
