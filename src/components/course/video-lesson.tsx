"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { youTubeId, vimeoId } from "@/lib/video";
import type { VideoProvider } from "@/lib/video";
import { saveVideoProgressAction } from "@/app/(learn)/learn/[slug]/actions";

export type CueQuestion = {
  id: string;
  atSec: number;
  prompt: string;
  options: string[];
  correct: number;
};

/** Load an external script once (deduped across mounts). */
const scriptCache = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  let p = scriptCache.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(el);
    });
    scriptCache.set(src, p);
  }
  return p;
}

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
  const mountRef = useRef<HTMLDivElement>(null);
  const watchedRef = useRef(initialWatchedSec);
  const lastTimeRef = useRef(0);
  const lastSaveRef = useRef(0);
  const answeredRef = useRef<Set<string>>(new Set());
  const activeCueRef = useRef<CueQuestion | null>(null);
  const resumeRef = useRef<() => void>(() => {});
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

  /**
   * Shared per-tick logic for all providers: accumulate watched time
   * (forward-only, seek-proof), throttle persistence, and trigger the next
   * unanswered in-video question, pausing playback until it is answered.
   */
  const processTick = useCallback(
    (now: number, duration: number, isPlaying: boolean, pause: () => void) => {
      const delta = now - lastTimeRef.current;
      if (delta > 0 && delta < 1.5 && isPlaying) {
        watchedRef.current = Math.min(
          watchedRef.current + delta,
          duration || watchedRef.current + delta,
        );
        onWatched(watchedRef.current, duration || 0);
      }
      lastTimeRef.current = now;

      if (now - lastSaveRef.current > 5) {
        lastSaveRef.current = now;
        save(now);
      }

      if (!activeCueRef.current) {
        const due = sortedQuestions.find(
          (q) => !answeredRef.current.has(q.id) && now >= q.atSec,
        );
        if (due) {
          activeCueRef.current = due;
          setActiveCue(due);
          pause();
        }
      }
    },
    // sortedQuestions is derived from a stable prop each render; save/onWatched are stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [save, onWatched],
  );

  function passCue(cue: CueQuestion) {
    answeredRef.current.add(cue.id);
    activeCueRef.current = null;
    setActiveCue(null);
    resumeRef.current();
  }

  // ---- YouTube ----
  useEffect(() => {
    if (provider !== "youtube") return;
    const id = youTubeId(src);
    if (!id || !mountRef.current) return;
    let player: YTPlayer | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    ensureYouTubeApi().then((YT) => {
      if (cancelled || !mountRef.current) return;
      player = new YT.Player(mountRef.current, {
        videoId: id,
        events: {
          onReady: () => {
            resumeRef.current = () => player?.playVideo();
            if (initialPositionSec > 0) player?.seekTo(initialPositionSec, true);
            onWatched(watchedRef.current, player?.getDuration?.() ?? 0);
            poll = setInterval(() => {
              if (!player) return;
              const playing = player.getPlayerState() === 1; // YT.PlayerState.PLAYING
              processTick(
                player.getCurrentTime(),
                player.getDuration(),
                playing,
                () => player?.pauseVideo(),
              );
            }, 500);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      const t = lastTimeRef.current;
      if (t > 0) save(t);
      player?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, src]);

  // ---- Vimeo ----
  useEffect(() => {
    if (provider !== "vimeo") return;
    const id = vimeoId(src);
    if (!id || !mountRef.current) return;
    let player: VimeoPlayer | null = null;
    let cancelled = false;

    loadScript("https://player.vimeo.com/api/player.js").then(() => {
      if (cancelled || !mountRef.current || !window.Vimeo) return;
      player = new window.Vimeo.Player(mountRef.current, {
        id: Number(id),
        responsive: true,
      });
      resumeRef.current = () => void player?.play();
      if (initialPositionSec > 0) void player.setCurrentTime(initialPositionSec);
      player.on("timeupdate", (d: { seconds: number; duration: number }) => {
        processTick(d.seconds, d.duration, true, () => void player?.pause());
      });
    });

    return () => {
      cancelled = true;
      const t = lastTimeRef.current;
      if (t > 0) save(t);
      player?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, src]);

  // Google Drive & other uncontrolled embeds: plain iframe (no tracking).
  if (provider === "embed") {
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
    <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
      {provider === "file" ? (
        <video
          ref={videoRef}
          src={src}
          controls={!activeCue}
          controlsList="nodownload"
          className="h-full w-full"
          preload="metadata"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            resumeRef.current = () => void v.play().catch(() => {});
            if (initialPositionSec > 0 && initialPositionSec < v.duration - 2) {
              v.currentTime = initialPositionSec;
            }
            onWatched(watchedRef.current, v.duration || 0);
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            processTick(v.currentTime, v.duration, !v.paused, () => v.pause());
          }}
          onPause={(e) => save(e.currentTarget.currentTime)}
          onEnded={(e) => save(e.currentTarget.currentTime)}
        >
          Your browser does not support embedded video.
        </video>
      ) : (
        // YouTube / Vimeo mount into this element via their SDK.
        <div ref={mountRef} className="h-full w-full" />
      )}

      {activeCue && <CueOverlay cue={activeCue} onPass={() => passCue(activeCue)} />}
    </div>
  );
}

function CueOverlay({ cue, onPass }: { cue: CueQuestion; onPass: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-4">
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

// ---- Minimal typings + loader for the YouTube IFrame API ----
type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (sec: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy?: () => void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      events?: { onReady?: () => void };
    },
  ) => YTPlayer;
};
type VimeoPlayer = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  setCurrentTime: (sec: number) => Promise<number>;
  on: (event: string, cb: (data: { seconds: number; duration: number }) => void) => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
    Vimeo?: { Player: new (el: HTMLElement, opts: { id: number; responsive?: boolean }) => VimeoPlayer };
  }
}

let ytReady: Promise<YTNamespace> | null = null;
function ensureYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytReady) {
    ytReady = new Promise<YTNamespace>((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (window.YT) resolve(window.YT);
      };
      void loadScript("https://www.youtube.com/iframe_api");
    });
  }
  return ytReady;
}
