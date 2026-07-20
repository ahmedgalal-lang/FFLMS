"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  FileText,
  Paperclip,
  Loader2,
} from "lucide-react";
import type { ContentBlock } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { completeLessonAction } from "@/app/(learn)/learn/[slug]/actions";
import { QuizTaker } from "@/components/quiz/quiz-taker";
import { AssignmentPanel } from "@/components/assignment/assignment-panel";

type PlayerLesson = {
  id: string;
  title: string;
  isRequired: boolean;
  moduleId: string;
};
type PlayerModule = { id: string; title: string; lessons: PlayerLesson[] };
type PlayerCourse = {
  id: string;
  title: string;
  slug: string;
  modules: PlayerModule[];
};
type LessonAssignment = {
  id: string;
  title: string;
  instructions: string;
  dueAt: Date | null;
  allowText: boolean;
  allowFile: boolean;
  maxPoints: number;
};
type CurrentLesson =
  | (PlayerLesson & {
      contentBlocks: ContentBlock[];
      quiz: { id: string; title: string } | null;
      assignment: LessonAssignment | null;
    })
  | null;
type MySubmission = {
  id: string;
  text: string | null;
  fileUrl: string | null;
  status: string;
  isLate: boolean;
  score: number | null;
  feedback: string | null;
} | null;

export function CoursePlayer({
  slug,
  course,
  completedIds,
  currentLesson,
  mySubmission,
  progressPercent,
}: {
  slug: string;
  course: PlayerCourse;
  completedIds: string[];
  currentLesson: CurrentLesson;
  mySubmission: MySubmission;
  progressPercent: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(completedIds),
  );
  const [progress, setProgress] = useState(progressPercent);
  const [error, setError] = useState<string | null>(null);

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = currentLesson
    ? allLessons.findIndex((l) => l.id === currentLesson.id)
    : -1;
  const nextLesson =
    currentIndex >= 0 ? allLessons[currentIndex + 1] : undefined;

  function markComplete() {
    if (!currentLesson) return;
    setError(null);
    startTransition(async () => {
      const res = await completeLessonAction(slug, currentLesson.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCompleted((prev) => new Set(prev).add(currentLesson.id));
      if (typeof res.progressPercent === "number") setProgress(res.progressPercent);
      if (nextLesson) {
        router.push(`/learn/${slug}?lesson=${nextLesson.id}`);
      } else {
        router.refresh();
      }
    });
  }

  const isCurrentComplete = currentLesson
    ? completed.has(currentLesson.id)
    : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Sidebar: curriculum + progress */}
      <aside className="space-y-4">
        <div>
          <Link
            href="/my-learning"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← My Learning
          </Link>
          <h2 className="mt-1 font-semibold leading-tight">{course.title}</h2>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <nav className="space-y-4">
          {course.modules.map((mod, mi) => (
            <div key={mod.id}>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {mi + 1}. {mod.title}
              </p>
              <ul className="space-y-0.5">
                {mod.lessons.map((lesson) => {
                  const done = completed.has(lesson.id);
                  const active = currentLesson?.id === lesson.id;
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/learn/${slug}?lesson=${lesson.id}`}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                          active
                            ? "bg-primary/10 font-medium text-primary"
                            : "hover:bg-muted",
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="line-clamp-2">{lesson.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main: current lesson */}
      <div className="space-y-6">
        {!currentLesson ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            This course has no lessons yet.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold">{currentLesson.title}</h1>
              {isCurrentComplete && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Completed
                </span>
              )}
            </div>

            <div className="space-y-6">
              {currentLesson.contentBlocks.map((block) => (
                <LessonBlock key={block.id} block={block} />
              ))}
              {currentLesson.contentBlocks.length === 0 && (
                <p className="text-muted-foreground">
                  No content in this lesson yet.
                </p>
              )}

              {currentLesson.quiz && (
                <QuizTaker quizId={currentLesson.quiz.id} />
              )}

              {currentLesson.assignment && (
                <AssignmentPanel
                  assignment={{
                    ...currentLesson.assignment,
                    dueAt: currentLesson.assignment.dueAt
                      ? currentLesson.assignment.dueAt.toISOString()
                      : null,
                  }}
                  submission={mySubmission}
                />
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 border-t pt-6">
              <Button onClick={markComplete} disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                {isCurrentComplete
                  ? "Mark complete again"
                  : nextLesson
                    ? "Complete & continue"
                    : "Mark complete"}
              </Button>
              {nextLesson && (
                <Button asChild variant="outline">
                  <Link href={`/learn/${slug}?lesson=${nextLesson.id}`}>
                    Skip to next
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LessonBlock({ block }: { block: ContentBlock }) {
  if (block.type === "TEXT") {
    return (
      <div
        className="prose prose-sm max-w-none rounded-lg border bg-card p-6"
        // Authored by the instructor; a production build sanitizes on save.
        dangerouslySetInnerHTML={{ __html: block.text ?? "" }}
      />
    );
  }
  if (block.type === "VIDEO") {
    return (
      <div className="aspect-video overflow-hidden rounded-lg border bg-black">
        <iframe
          src={block.mediaUrl ?? ""}
          title="Lesson video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <a
      href={block.mediaUrl ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:border-primary"
    >
      {block.type === "FILE" ? (
        <Paperclip className="h-5 w-5 text-muted-foreground" />
      ) : (
        <FileText className="h-5 w-5 text-muted-foreground" />
      )}
      <span className="text-sm font-medium">
        {block.fileName ?? "Download file"}
      </span>
    </a>
  );
}
