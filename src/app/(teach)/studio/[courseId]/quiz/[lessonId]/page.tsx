import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { getLessonQuizForEditing } from "@/server/services/quiz";
import { QuizBuilder } from "@/components/quiz/quiz-builder";

export const metadata: Metadata = { title: "Quiz builder" };

export default async function QuizBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const principal = await requirePrincipal();
  const lesson = await getLessonQuizForEditing(principal, lessonId);
  if (!lesson) notFound();

  return (
    <QuizBuilder
      courseId={courseId}
      lessonId={lessonId}
      lessonTitle={lesson.title}
      quiz={lesson.quiz}
    />
  );
}
