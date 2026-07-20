"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { HelpCircle, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AttemptQuestion = {
  id: string;
  type: string;
  prompt: string;
  points: number;
  options: { id: string; text: string }[];
};
type StartedAttempt = {
  attemptId: string;
  title: string;
  deadline: string | null;
  timeLimitSec: number | null;
  attemptNumber: number;
  questions: AttemptQuestion[];
};
type Result = {
  score: number;
  passed: boolean;
  expired: boolean;
  perQuestion: { questionId: string; correct: boolean }[];
};

export function QuizTaker({ quizId }: { quizId: string }) {
  const [attempt, setAttempt] = useState<StartedAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const submittedRef = useRef(false);

  async function start() {
    setLoading(true);
    setError(null);
    setResult(null);
    submittedRef.current = false;
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not start quiz.");
      setAttempt(body);
      setAnswers({});
      setTexts({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start quiz.");
    } finally {
      setLoading(false);
    }
  }

  const submit = useCallback(async () => {
    if (!attempt || submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        answers: attempt.questions.map((q) => ({
          questionId: q.id,
          selectedOptionIds: answers[q.id] ?? [],
          answerText: texts[q.id] ?? null,
        })),
      };
      const res = await fetch(`/api/attempts/${attempt.attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not submit.");
      setResult(body);
      setAttempt(null);
    } catch (e) {
      submittedRef.current = false;
      setError(e instanceof Error ? e.message : "Could not submit.");
    } finally {
      setLoading(false);
    }
  }, [attempt, answers, texts]);

  // Countdown timer with auto-submit on expiry (server re-verifies).
  useEffect(() => {
    if (!attempt?.deadline) {
      setRemaining(null);
      return;
    }
    const deadline = new Date(attempt.deadline).getTime();
    const tick = () => {
      const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) submit();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [attempt, submit]);

  function toggle(q: AttemptQuestion, optionId: string) {
    setAnswers((prev) => {
      const cur = prev[q.id] ?? [];
      if (q.type === "MULTI_SELECT") {
        return {
          ...prev,
          [q.id]: cur.includes(optionId)
            ? cur.filter((x) => x !== optionId)
            : [...cur, optionId],
        };
      }
      return { ...prev, [q.id]: [optionId] };
    });
  }

  // Results view
  if (result) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3">
          {result.passed ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : (
            <XCircle className="h-8 w-8 text-destructive" />
          )}
          <div>
            <p className="text-lg font-semibold">
              {result.score}% — {result.passed ? "Passed" : "Not passed"}
            </p>
            {result.expired && (
              <p className="text-sm text-amber-600">
                Time expired; graded on captured answers.
              </p>
            )}
          </div>
        </div>
        <Button className="mt-4" variant="outline" onClick={start}>
          Try again
        </Button>
      </div>
    );
  }

  // Taking view
  if (attempt) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{attempt.title}</h3>
          {remaining !== null && (
            <Badge variant={remaining < 30 ? "destructive" : "secondary"}>
              <Clock className="mr-1 h-3 w-3" />
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </Badge>
          )}
        </div>

        {attempt.questions.map((q, i) => (
          <fieldset key={q.id} className="space-y-2 border-t pt-4">
            <legend className="font-medium">
              {i + 1}. {q.prompt}{" "}
              <span className="text-xs text-muted-foreground">
                ({q.points} pt)
              </span>
            </legend>
            {q.type === "SHORT_ANSWER" ? (
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={texts[q.id] ?? ""}
                onChange={(e) =>
                  setTexts((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                aria-label={`Answer for question ${i + 1}`}
              />
            ) : (
              q.options.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm">
                  <input
                    type={q.type === "MULTI_SELECT" ? "checkbox" : "radio"}
                    name={q.id}
                    checked={(answers[q.id] ?? []).includes(o.id)}
                    onChange={() => toggle(q, o.id)}
                  />
                  {o.text}
                </label>
              ))
            )}
          </fieldset>
        ))}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : null} Submit quiz
        </Button>
      </div>
    );
  }

  // Start view
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Quiz</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Test your understanding of this lesson.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button className="mt-4" onClick={start} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : null} Start quiz
      </Button>
    </div>
  );
}
