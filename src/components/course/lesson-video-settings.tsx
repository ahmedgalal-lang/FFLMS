"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateLessonAction,
  addVideoQuestionAction,
  deleteVideoQuestionAction,
} from "@/app/(teach)/studio/actions";

type VideoQuestion = {
  id: string;
  atSec: number;
  prompt: string;
  options: string[];
  correct: number;
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LessonVideoSettings({
  courseId,
  lessonId,
  minWatchPercent,
  questions,
}: {
  courseId: string;
  lessonId: string;
  minWatchPercent: number;
  questions: VideoQuestion[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [minWatch, setMinWatch] = useState(String(minWatchPercent));
  const [adding, setAdding] = useState(false);

  // New-question form state.
  const [at, setAt] = useState("0");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correct, setCorrect] = useState(0);

  function run(fn: () => Promise<{ error?: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function saveMinWatch() {
    run(() =>
      updateLessonAction(courseId, lessonId, {
        minWatchPercent: Math.max(0, Math.min(100, Number(minWatch) || 0)),
      }),
    );
  }

  function addQuestion() {
    run(async () => {
      const res = await addVideoQuestionAction(courseId, lessonId, {
        atSec: Number(at) || 0,
        prompt,
        options,
        correct,
      });
      if (!res?.error) {
        setAdding(false);
        setAt("0");
        setPrompt("");
        setOptions(["", ""]);
        setCorrect(0);
      }
      return res;
    });
  }

  return (
    <div className="mt-3 rounded-md border border-dashed bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Video settings
      </p>

      {/* Watch gate */}
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`mw-${lessonId}`} className="text-xs">
            Require watching (%)
          </Label>
          <Input
            id={`mw-${lessonId}`}
            type="number"
            min={0}
            max={100}
            value={minWatch}
            onChange={(e) => setMinWatch(e.target.value)}
            className="h-8 w-24"
          />
        </div>
        <Button size="sm" variant="outline" onClick={saveMinWatch} disabled={pending}>
          Save
        </Button>
        <span className="text-xs text-muted-foreground">
          0 = no gate. Applies to uploaded videos.
        </span>
      </div>

      {/* Existing cue questions */}
      {questions.length > 0 && (
        <ul className="mt-3 space-y-1">
          {questions.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between rounded bg-background px-2 py-1 text-sm"
            >
              <span className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="tabular-nums text-muted-foreground">
                  {fmt(q.atSec)}
                </span>
                {q.prompt}
              </span>
              <button
                aria-label="Delete question"
                className="text-muted-foreground hover:text-destructive"
                disabled={pending}
                onClick={() =>
                  run(() => deleteVideoQuestionAction(courseId, q.id))
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add cue question */}
      {adding ? (
        <div className="mt-3 space-y-2 rounded border bg-background p-3">
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">At (seconds)</Label>
              <Input
                type="number"
                min={0}
                value={at}
                onChange={(e) => setAt(e.target.value)}
                className="h-8 w-24"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Question</Label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What did the video just explain?"
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              Options (select the correct one)
            </Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${lessonId}`}
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  aria-label={`Mark option ${i + 1} correct`}
                />
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="h-8"
                />
                {options.length > 2 && (
                  <button
                    aria-label={`Remove option ${i + 1}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setOptions(options.filter((_, j) => j !== i));
                      if (correct >= options.length - 1) setCorrect(0);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setOptions([...options, ""])}
              >
                <Plus className="h-3.5 w-3.5" /> Add option
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addQuestion} disabled={pending}>
              Add question
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAdding(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add in-video question
        </Button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
