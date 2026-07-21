"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoProvider } from "@/lib/video";
import { saveVideoProgressAction } from "@/app/(learn)/learn/[slug]/actions";

export type CueQuestion = {
  id: string;
  atSec: number;
  prompt: string;
  options: string[];
  correct: number;
};

export function VideoLesson({
  lessonId,
  src,
  provider,
  initialPositionSec,
  initialWatchedSec,
  questions,
  onWatched,
}: {
  lessonId: string;
  src: string;
  provider: VideoProvider;
  initialPositionSec: number;
  initialWatchedSec: number;
  questions: CueQuestion[];
  /** Report (watchedSec, durationSec) up so the parent can gate advancement. */
  onWatched: (watchedSec: number, durationSec: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchedRef = useRef(initialWatchedSec);
  const lastTimeRef = useRef(0);
  const lastSaveRef = useRef(0);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [activeCue, setActiveCue] = useState<CueQuestion | null>(null);

  const sortedQuestions = [...questions].sort((a, b) => a.atSec - b.atSec);

  const save = useCallback(
    (positionSec: number) => {
      void saveVideoProgressAction(
        lessonId,
        positionSec,
        Math.round(watchedRef.current),
      );
    },
    [lessonId],
  );

  // Only native files can be controlled (resume, watch-gate, in-video quiz).
  if (provider !== "file") {
    return (
      <div className="aspect-video overflow-hidden rounded-lg border bg-black">
        <iframe
          src={src}
          title="Lesson video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
        <video
          ref={videoRef}
          src={src}
          controls={!activeCue}
          controlsList="nodownload"
          className="h-full w-full"
          preload="metadata"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (
              initialPositionSec > 0 &&
              initialPositionSec < v.duration - 2
            ) {
              v.currentTime = initialPositionSec;
            }
            onWatched(watchedRef.current, v.duration || 0);
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            const now = v.currentTime;
            // Accumulate only forward, small steps (ignore seeks).
            const delta = now - lastTimeRef.current;
            if (delta > 0 && delta < 1.5 && !v.paused) {
              watchedRef.current = Math.min(
                watchedRef.current + delta,
                v.duration || watchedRef.current + delta,
              );
              onWatched(watchedRef.current, v.duration || 0);
            }
            lastTimeRef.current = now;

            // Throttle persistence to ~every 5s of playback.
            if (now - lastSaveRef.current > 5) {
              lastSaveRef.current = now;
              save(now);
            }

            // Trigger the first unanswered question we've reached.
            if (!activeCue) {
              const due = sortedQuestions.find(
                (q) => !answered.has(q.id) && now >= q.atSec,
              );
              if (due) {
                v.pause();
                setActiveCue(due);
              }
            }
          }}
          onPause={(e) => save(e.currentTarget.currentTime)}
          onEnded={(e) => save(e.currentTarget.currentTime)}
        >
          Your browser does not support embedded video.
        </video>

        {activeCue && (
          <CueOverlay
            cue={activeCue}
            onPass={() => {
              setAnswered((prev) => new Set(prev).add(activeCue.id));
              setActiveCue(null);
              // Resume playback after answering correctly.
              videoRef.current?.play().catch(() => {});
            }}
          />
        )}
      </div>
    </div>
  );
}

function CueOverlay({
  cue,
  onPass,
}: {
  cue: CueQuestion;
  onPass: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-5 shadow-lg">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <HelpCircle className="h-4 w-4" /> Quick check
        </p>
        <p className="mt-2 font-semibold">{cue.prompt}</p>
        <div className="mt-3 space-y-2">
          {cue.options.map((opt, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${
                selected === i ? "border-primary bg-primary/5" : ""
              }`}
            >
              <input
                type="radio"
                name={`cue-${cue.id}`}
                checked={selected === i}
                onChange={() => {
                  setSelected(i);
                  setWrong(false);
                }}
                className="h-4 w-4"
              />
              {opt}
            </label>
          ))}
        </div>
        {wrong && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Not quite — try again.
          </p>
        )}
        <Button
          className="mt-4 w-full"
          disabled={selected === null}
          onClick={() => {
            if (selected === cue.correct) onPass();
            else setWrong(true);
          }}
        >
          <CheckCircle2 className="h-4 w-4" /> Submit answer
        </Button>
      </div>
    </div>
  );
}
