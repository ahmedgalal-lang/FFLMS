"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  FileText,
  Paperclip,
  Award,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { ContentBlock } from "@prisma/client";
import { isEmbedVideo, videoProvider } from "@/lib/video";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { completeLessonAction } from "@/app/(learn)/learn/[slug]/actions";
import { QuizTaker } from "@/components/quiz/quiz-taker";
import { AssignmentPanel } from "@/components/assignment/assignment-panel";
import { VideoLesson, type CueQuestion } from "@/components/course/video-lesson";

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
      minWatchPercent: number;
      contentBlocks: ContentBlock[];
      videoQuestions: CueQuestion[];
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
  videoProgress,
  mySubmission,
  progressPercent,
}: {
  slug: string;
  course: PlayerCourse;
  completedIds: string[];
  currentLesson: CurrentLesson;
  videoProgress: { positionSec: number; watchedSec: number };
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
  const [watchedPct, setWatchedPct] = useState(0);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function toggleModule(moduleId: string) {
    setCollapsedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }

  // The first controllable video block (file / YouTube / Vimeo — not an
  // uncontrolled embed like Drive) gates advancement.
  const gateVideoBlock = currentLesson?.contentBlocks.find(
    (b) => b.type === "VIDEO" && videoProvider(b.mediaUrl ?? "") !== "embed",
  );
  const minWatch = currentLesson?.minWatchPercent ?? 0;
  // Any trackable video gates the lesson — by default you must reach the
  // last 30s of playback; an instructor-set minWatchPercent can unlock it
  // earlier (or, if higher, still requires that much watched too).
  const gateActive = !!gateVideoBlock;
  const NEAR_END_SEC = 30;
  const isNearEnd = remainingSec !== null && remainingSec <= NEAR_END_SEC;
  const canComplete =
    !gateActive || isNearEnd || (minWatch > 0 && watchedPct >= minWatch);

  // Reset the watch meter whenever the lesson changes, seeding from saved
  // progress (we don't yet know duration, so start at 0 and let the player
  // report the true % once metadata loads).
  useEffect(() => {
    setWatchedPct(0);
    setRemainingSec(null);
  }, [currentLesson?.id]);

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
    <div
      className={cn(
        "grid gap-6",
        sidebarOpen ? "lg:grid-cols-[300px_1fr]" : "lg:grid-cols-1",
      )}
    >
      {/* Sidebar: curriculum + progress */}
      {sidebarOpen && (
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

        <div className="flex flex-col gap-1.5">
          <Link
            href={`/learn/${slug}/grades`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Award className="h-4 w-4" /> My grades &amp; certificate
          </Link>
          <Link
            href={`/learn/${slug}/discussions`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <MessageSquare className="h-4 w-4" /> Discussion &amp; announcements
          </Link>
        </div>

        <nav className="space-y-3">
          {course.modules.map((mod, mi) => {
            const moduleCollapsed = collapsedModules[mod.id];
            const doneCount = mod.lessons.filter((l) => completed.has(l.id)).length;
            return (
              <div key={mod.id}>
                <button
                  type="button"
                  className="mb-1 flex w-full items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  onClick={() => toggleModule(mod.id)}
                  aria-expanded={!moduleCollapsed}
                  aria-label={`${moduleCollapsed ? "Expand" : "Collapse"} module ${mod.title}`}
                >
                  {moduleCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">
                    {mi + 1}. {mod.title}
                  </span>
                  <span className="ml-auto shrink-0 normal-case tabular-nums">
                    {doneCount}/{mod.lessons.length}
                  </span>
                </button>
                {!moduleCollapsed && (
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
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      )}

      {/* Main: current lesson */}
      <div className="space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? "Hide course list" : "Show course list"}
          className="gap-1.5"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
          {sidebarOpen ? "Hide list" : "Show list"}
        </Button>

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
              {currentLesson.contentBlocks.map((block) => {
                // Videos use the interactive player (resume, watch-tracking,
                // in-video questions). The gating block also feeds the watch
                // meter and carries the saved position + cue questions.
                if (block.type === "VIDEO") {
                  const isGate = block.id === gateVideoBlock?.id;
                  return (
                    <VideoLesson
                      key={block.id}
                      lessonId={currentLesson.id}
                      src={block.mediaUrl ?? ""}
                      provider={videoProvider(block.mediaUrl ?? "")}
                      initialPositionSec={isGate ? videoProgress.positionSec : 0}
                      initialWatchedSec={isGate ? videoProgress.watchedSec : 0}
                      questions={isGate ? currentLesson.videoQuestions : []}
                      onWatched={
                        isGate
                          ? (watchedSec, durationSec) =>
                              setWatchedPct(
                                durationSec > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        (watchedSec / durationSec) * 100,
                                      ),
                                    )
                                  : 0,
                              )
                          : () => {}
                      }
                      onEnded={
                        isGate && !isCurrentComplete ? markComplete : undefined
                      }
                      onProgress={
                        isGate
                          ? (currentSec, durationSec) =>
                              setRemainingSec(
                                durationSec > 0 ? durationSec - currentSec : null,
                              )
                          : undefined
                      }
                    />
                  );
                }
                return <LessonBlock key={block.id} block={block} />;
              })}
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

            {gateActive && !isCurrentComplete && !canComplete && (
              <p className="text-sm text-muted-foreground">
                {minWatch > 0
                  ? `Watch at least ${minWatch}% of the video, or reach the end, to continue (${watchedPct}% watched).`
                  : "Keep watching — you can mark this lesson complete once you're near the end of the video."}
              </p>
            )}

            <div className="flex items-center gap-3 border-t pt-6">
              <Button
                onClick={markComplete}
                disabled={pending || (gateActive && !isCurrentComplete && !canComplete)}
              >
                {pending ? <Loader2 className="animate-spin" /> : null}
                {isCurrentComplete
                  ? "Mark complete again"
                  : nextLesson
                    ? "Complete & continue"
                    : "Mark complete"}
              </Button>
              {nextLesson && !gateActive && (
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
    const src = block.mediaUrl ?? "";
    return (
      <div className="aspect-video overflow-hidden rounded-lg border bg-black">
        {isEmbedVideo(src) ? (
          <iframe
            src={src}
            title="Lesson video"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={src}
            controls
            controlsList="nodownload"
            className="h-full w-full"
            preload="metadata"
          >
            Your browser does not support embedded video.
          </video>
        )}
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
