"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  FileText,
  Video,
  Paperclip,
  ExternalLink,
  HelpCircle,
  ClipboardList,
  BarChart3,
  LineChart,
  MessageSquare,
  Loader2,
  UserPlus,
  Award,
} from "lucide-react";
import type {
  Course,
  Module,
  Lesson,
  ContentBlock,
  Category,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  addModuleAction,
  deleteModuleAction,
  addLessonAction,
  deleteLessonAction,
  deleteContentBlockAction,
  publishCourseAction,
  unpublishCourseAction,
  submitForReviewAction,
} from "@/app/(teach)/studio/actions";
import { ContentBlockEditor } from "@/components/course/content-block-editor";
import { CourseSettingsDialog } from "@/components/course/course-settings-dialog";
import { LessonVideoSettings } from "@/components/course/lesson-video-settings";

type FullLesson = Lesson & {
  contentBlocks: ContentBlock[];
  videoQuestions: {
    id: string;
    atSec: number;
    prompt: string;
    options: string[];
    correct: number;
  }[];
  quiz: { id: string } | null;
  assignment: { id: string } | null;
};
type FullModule = Module & { lessons: FullLesson[] };
type FullCourse = Course & { category: Category | null; modules: FullModule[] };

const blockIcon = { TEXT: FileText, VIDEO: Video, FILE: Paperclip } as const;

export function CourseBuilder({
  course,
  publishProblems,
  categories,
  videoUploadEnabled,
}: {
  course: FullCourse;
  publishProblems: string[];
  categories: { id: string; name: string }[];
  videoUploadEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newModule, setNewModule] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isPublished = course.status === "PUBLISHED";

  function run(fn: () => Promise<{ error?: string } | undefined | void>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/studio"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← All courses
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">{course.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isPublished ? "success" : "secondary"}>
            {course.status.toLowerCase().replace("_", " ")}
          </Badge>
          {course.visibility === "RESTRICTED" && (
            <Badge variant="warning">Restricted</Badge>
          )}
          <CourseSettingsDialog
            course={{
              id: course.id,
              title: course.title,
              summary: course.summary,
              description: course.description,
              categoryId: course.categoryId,
              completionThreshold: course.completionThreshold,
              coverImageUrl: course.coverImageUrl,
              visibility: course.visibility,
            }}
            categories={categories}
          />
          {course.visibility === "RESTRICTED" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/studio/${course.id}/assign`}>
                <UserPlus /> Assign students
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/studio/${course.id}/gradebook`}>
              <BarChart3 /> Gradebook
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/studio/${course.id}/certificates`}>
              <Award /> Certificates
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/studio/${course.id}/analytics`}>
              <LineChart /> Analytics
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/learn/${course.slug}/discussions`}>
              <MessageSquare /> Discussion
            </Link>
          </Button>
          {isPublished ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/courses/${course.slug}`}>
                  View <ExternalLink />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => run(() => unpublishCourseAction(course.id))}
              >
                Unpublish
              </Button>
            </>
          ) : course.status === "IN_REVIEW" ? (
            <Badge variant="warning">Submitted for review</Badge>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={pending || publishProblems.length > 0}
                onClick={() => run(() => submitForReviewAction(course.id))}
              >
                Submit for review
              </Button>
              <Button
                size="sm"
                disabled={pending || publishProblems.length > 0}
                onClick={() => run(() => publishCourseAction(course.id))}
              >
                {pending ? <Loader2 className="animate-spin" /> : null} Publish
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!isPublished && publishProblems.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Before you can publish:</p>
          <ul className="mt-1 list-inside list-disc">
            {publishProblems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Modules */}
      <div className="space-y-4">
        {course.modules.map((mod, mi) => (
          <div key={mod.id} className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-semibold">
                <span className="text-muted-foreground">Module {mi + 1}:</span>{" "}
                {mod.title}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete module ${mod.title}`}
                disabled={pending}
                onClick={() => run(() => deleteModuleAction(course.id, mod.id))}
              >
                <Trash2 />
              </Button>
            </div>

            <div className="divide-y">
              {mod.lessons.map((lesson, li) => (
                <div key={lesson.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {mi + 1}.{li + 1} {lesson.title}
                      </span>
                      {!lesson.isRequired && (
                        <Badge variant="outline">optional</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete lesson ${lesson.title}`}
                      disabled={pending}
                      onClick={() =>
                        run(() => deleteLessonAction(course.id, lesson.id))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  {/* Content blocks */}
                  <ul className="mt-3 space-y-1">
                    {lesson.contentBlocks.map((block) => {
                      const Icon = blockIcon[block.type];
                      return (
                        <li
                          key={block.id}
                          className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {block.type === "TEXT"
                              ? "Text block"
                              : block.type === "VIDEO"
                                ? "Video"
                                : (block.fileName ?? "File")}
                          </span>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove content block"
                            disabled={pending}
                            onClick={() =>
                              run(() =>
                                deleteContentBlockAction(course.id, block.id),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <ContentBlockEditor
                    courseId={course.id}
                    lessonId={lesson.id}
                    videoUploadEnabled={videoUploadEnabled}
                  />

                  {lesson.contentBlocks.some((b) => b.type === "VIDEO") && (
                    <LessonVideoSettings
                      courseId={course.id}
                      lessonId={lesson.id}
                      minWatchPercent={lesson.minWatchPercent}
                      questions={lesson.videoQuestions}
                    />
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/studio/${course.id}/quiz/${lesson.id}`}>
                        <HelpCircle />
                        {lesson.quiz ? "Edit quiz" : "Add quiz"}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/studio/${course.id}/assignment/${lesson.id}`}>
                        <ClipboardList />
                        {lesson.assignment ? "Edit assignment" : "Add assignment"}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}

              <AddLesson
                disabled={pending}
                onAdd={(title) =>
                  run(() => addLessonAction(course.id, mod.id, title))
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add module */}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newModule.trim()) return;
          const title = newModule;
          setNewModule("");
          run(() => addModuleAction(course.id, title));
        }}
      >
        <Input
          value={newModule}
          onChange={(e) => setNewModule(e.target.value)}
          placeholder="New module title"
          aria-label="New module title"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus /> Add module
        </Button>
      </form>
    </div>
  );
}

function AddLesson({
  onAdd,
  disabled,
}: {
  onAdd: (title: string) => void;
  disabled: boolean;
}) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="flex gap-2 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd(title);
        setTitle("");
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New lesson title"
        aria-label="New lesson title"
        className="h-9"
      />
      <Button type="submit" variant="ghost" size="sm" disabled={disabled}>
        <Plus /> Add lesson
      </Button>
    </form>
  );
}
