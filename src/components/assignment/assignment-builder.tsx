"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, FileText, CheckCircle2, Clock } from "lucide-react";
import type { Assignment, Submission } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  saveAssignmentAction,
  gradeSubmissionAction,
} from "@/app/(teach)/studio/[courseId]/assignment/[lessonId]/actions";

type SubmissionWithStudent = Submission & {
  student: { name: string; email: string };
};

/** Convert a Date to the value a datetime-local input expects. */
function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  const off = dt.getTimezoneOffset();
  return new Date(dt.getTime() - off * 60_000).toISOString().slice(0, 16);
}

export function AssignmentBuilder({
  courseId,
  lessonId,
  lessonTitle,
  assignment,
  submissions,
  maxPoints,
}: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  assignment: Assignment | null;
  submissions: SubmissionWithStudent[];
  maxPoints: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(assignment?.title ?? `${lessonTitle} assignment`);
  const [instructions, setInstructions] = useState(assignment?.instructions ?? "");
  const [due, setDue] = useState(toLocalInput(assignment?.dueAt));
  const [points, setPoints] = useState(assignment?.maxPoints ?? 100);
  const [allowText, setAllowText] = useState(assignment?.allowText ?? true);
  const [allowFile, setAllowFile] = useState(assignment?.allowFile ?? true);
  const [latePolicy, setLatePolicy] = useState(assignment?.latePolicy ?? "ACCEPT");

  function run(fn: () => Promise<{ error?: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function save() {
    run(() =>
      saveAssignmentAction(courseId, lessonId, {
        title,
        instructions,
        dueAt: due ? new Date(due) : null,
        maxPoints: Number(points),
        allowText,
        allowFile,
        latePolicy,
      }),
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href={`/studio/${courseId}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Assignment · {lessonTitle}</h1>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {/* Settings */}
      <section className="space-y-4 rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Details</h2>
        <div className="space-y-2">
          <Label htmlFor="atitle">Title</Label>
          <Input id="atitle" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="due">Due date (optional)</Label>
            <Input id="due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Max points</Label>
            <Input id="points" type="number" min={1} value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="late">Late policy</Label>
            <select
              id="late"
              value={latePolicy}
              onChange={(e) => setLatePolicy(e.target.value as typeof latePolicy)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="ACCEPT">Accept &amp; flag late</option>
              <option value="PENALIZE">Accept &amp; penalize</option>
              <option value="REJECT">Reject after due</option>
            </select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Accepted submission types</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allowText} onChange={(e) => setAllowText(e.target.checked)} />
              Text
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allowFile} onChange={(e) => setAllowFile(e.target.checked)} />
              File upload
            </label>
          </fieldset>
        </div>
        <Button onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {assignment ? "Save assignment" : "Create assignment"}
        </Button>
      </section>

      {/* Grading queue */}
      {assignment && (
        <section className="space-y-3">
          <h2 className="font-semibold">
            Submissions{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({submissions.length})
            </span>
          </h2>
          {submissions.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No submissions yet.
            </p>
          ) : (
            submissions.map((sub) => (
              <SubmissionRow
                key={sub.id}
                courseId={courseId}
                lessonId={lessonId}
                submission={sub}
                maxPoints={maxPoints}
                disabled={pending}
                onGrade={(score, feedback) =>
                  run(() =>
                    gradeSubmissionAction(courseId, lessonId, sub.id, { score, feedback }),
                  )
                }
              />
            ))
          )}
        </section>
      )}
    </div>
  );
}

function SubmissionRow({
  submission,
  maxPoints,
  disabled,
  onGrade,
}: {
  courseId: string;
  lessonId: string;
  submission: SubmissionWithStudent;
  maxPoints: number;
  disabled: boolean;
  onGrade: (score: number, feedback: string) => void;
}) {
  const [score, setScore] = useState(submission.score ?? 0);
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const graded = submission.status === "GRADED";

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{submission.student.name}</span>
          {submission.isLate && (
            <Badge variant="warning">
              <Clock className="mr-1 h-3 w-3" /> late
            </Badge>
          )}
          {graded && (
            <Badge variant="success">
              <CheckCircle2 className="mr-1 h-3 w-3" /> {submission.score}/{maxPoints}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(submission.submittedAt).toLocaleString()}
        </span>
      </div>

      {submission.text && (
        <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
          {submission.text}
        </p>
      )}
      {submission.fileUrl && (
        <a
          href={submission.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <FileText className="h-4 w-4" /> View attachment
        </a>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`score-${submission.id}`} className="text-xs">
            Score (/{maxPoints})
          </Label>
          <Input
            id={`score-${submission.id}`}
            type="number"
            min={0}
            max={maxPoints}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="h-9 w-24"
          />
        </div>
        <Input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback (optional)"
          aria-label={`Feedback for ${submission.student.name}`}
          className="h-9 flex-1"
        />
        <Button size="sm" disabled={disabled} onClick={() => onGrade(Number(score), feedback)}>
          {graded ? "Update grade" : "Grade"}
        </Button>
      </div>
    </div>
  );
}
