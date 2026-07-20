"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import type { Quiz, Question, Option, QuestionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  saveQuizSettingsAction,
  addQuestionAction,
  deleteQuestionAction,
} from "@/app/(teach)/studio/[courseId]/quiz/[lessonId]/actions";

type FullQuestion = Question & { options: Option[] };
type FullQuiz = (Quiz & { questions: FullQuestion[] }) | null;

export function QuizBuilder({
  courseId,
  lessonId,
  lessonTitle,
  quiz,
}: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  quiz: FullQuiz;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Settings form state
  const [title, setTitle] = useState(quiz?.title ?? `${lessonTitle} quiz`);
  const [passingScore, setPassingScore] = useState(quiz?.passingScore ?? 70);
  const [timeLimitMin, setTimeLimitMin] = useState(
    quiz?.timeLimitSec ? Math.round(quiz.timeLimitSec / 60) : 0,
  );
  const [maxAttempts, setMaxAttempts] = useState(quiz?.maxAttempts ?? 0);

  function run(fn: () => Promise<{ error?: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function saveSettings() {
    run(() =>
      saveQuizSettingsAction(courseId, lessonId, {
        title,
        passingScore: Number(passingScore),
        timeLimitSec: timeLimitMin > 0 ? timeLimitMin * 60 : null,
        maxAttempts: maxAttempts > 0 ? Number(maxAttempts) : null,
      }),
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href={`/studio/${courseId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Quiz · {lessonTitle}</h1>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Settings */}
      <section className="space-y-4 rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="qtitle">Title</Label>
            <Input
              id="qtitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass">Passing score (%)</Label>
            <Input
              id="pass"
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time limit (min, 0 = none)</Label>
            <Input
              id="time"
              type="number"
              min={0}
              value={timeLimitMin}
              onChange={(e) => setTimeLimitMin(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="att">Max attempts (0 = unlimited)</Label>
            <Input
              id="att"
              type="number"
              min={0}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
            />
          </div>
        </div>
        <Button onClick={saveSettings} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {quiz ? "Save settings" : "Create quiz"}
        </Button>
      </section>

      {/* Questions */}
      {quiz && (
        <section className="space-y-4">
          <h2 className="font-semibold">
            Questions{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({quiz.questions.length})
            </span>
          </h2>

          {quiz.questions.map((q, i) => (
            <div key={q.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {i + 1}. {q.prompt}
                    </span>
                    <Badge variant="secondary">{q.points} pt</Badge>
                    <Badge variant="outline">
                      {q.type.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {q.type === "SHORT_ANSWER" ? (
                      <li className="text-muted-foreground">
                        Accepted answer: <code>{q.correctText}</code>
                      </li>
                    ) : (
                      q.options.map((o) => (
                        <li key={o.id} className="flex items-center gap-2">
                          {o.isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="inline-block h-4 w-4" />
                          )}
                          {o.text}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete question ${i + 1}`}
                  disabled={pending}
                  onClick={() =>
                    run(() => deleteQuestionAction(courseId, lessonId, q.id))
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}

          <AddQuestion
            disabled={pending}
            onAdd={(input) =>
              run(() =>
                addQuestionAction(courseId, lessonId, quiz.id, input),
              )
            }
          />
        </section>
      )}
    </div>
  );
}

function AddQuestion({
  onAdd,
  disabled,
}: {
  onAdd: (input: unknown) => void;
  disabled: boolean;
}) {
  const [type, setType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [prompt, setPrompt] = useState("");
  const [points, setPoints] = useState(1);
  const [correctText, setCorrectText] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ]);

  const isChoice = type !== "SHORT_ANSWER";

  function submit() {
    const payload =
      type === "SHORT_ANSWER"
        ? { type, prompt, points: Number(points), correctText }
        : {
            type,
            prompt,
            points: Number(points),
            options: options.filter((o) => o.text.trim()),
          };
    onAdd(payload);
    setPrompt("");
    setCorrectText("");
    setOptions([
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ]);
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <h3 className="text-sm font-medium">Add a question</h3>
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Question type"
          value={type}
          onChange={(e) => {
            const t = e.target.value as QuestionType;
            setType(t);
            if (t === "TRUE_FALSE") {
              setOptions([
                { text: "True", isCorrect: true },
                { text: "False", isCorrect: false },
              ]);
            }
          }}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="MULTIPLE_CHOICE">Multiple choice</option>
          <option value="MULTI_SELECT">Multi-select</option>
          <option value="TRUE_FALSE">True / False</option>
          <option value="SHORT_ANSWER">Short answer</option>
        </select>
        <Input
          type="number"
          min={1}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          aria-label="Points"
          className="h-9 w-24"
        />
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Question prompt…"
        aria-label="Question prompt"
      />

      {type === "SHORT_ANSWER" ? (
        <Input
          value={correctText}
          onChange={(e) => setCorrectText(e.target.value)}
          placeholder="Accepted answer"
          aria-label="Accepted answer"
        />
      ) : (
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={type === "MULTI_SELECT" ? "checkbox" : "radio"}
                name="correct"
                checked={o.isCorrect}
                aria-label={`Option ${i + 1} correct`}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((p, pi) =>
                      type === "MULTI_SELECT"
                        ? pi === i
                          ? { ...p, isCorrect: e.target.checked }
                          : p
                        : { ...p, isCorrect: pi === i },
                    ),
                  )
                }
              />
              <Input
                value={o.text}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((p, pi) =>
                      pi === i ? { ...p, text: e.target.value } : p,
                    ),
                  )
                }
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1} text`}
                className="h-9"
                disabled={type === "TRUE_FALSE"}
              />
            </div>
          ))}
          {type !== "TRUE_FALSE" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setOptions((prev) => [...prev, { text: "", isCorrect: false }])
              }
            >
              <Plus /> Add option
            </Button>
          )}
        </div>
      )}

      <Button
        onClick={submit}
        disabled={disabled || !prompt.trim() || (!isChoice && !correctText.trim())}
      >
        <Plus /> Add question
      </Button>
    </div>
  );
}
