"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Video, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addContentBlockAction } from "@/app/(teach)/studio/actions";
import { uploadFile, uploadVideo } from "@/lib/upload-client";
import { normalizeVideoUrl } from "@/lib/video";

type Mode = null | "TEXT" | "VIDEO" | "FILE";

export function ContentBlockEditor({
  courseId,
  lessonId,
  videoUploadEnabled,
}: {
  courseId: string;
  lessonId: string;
  videoUploadEnabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [videoSource, setVideoSource] = useState<"link" | "upload">(
    videoUploadEnabled ? "upload" : "link",
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  function submit(input: Record<string, unknown>) {
    setError(null);
    startTransition(async () => {
      const res = await addContentBlockAction(courseId, lessonId, input);
      if (res?.error) {
        setError(res.error);
      } else {
        setMode(null);
        setText("");
        setUrl("");
        router.refresh();
      }
    });
  }

  async function handleFile() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        const { url, name, size } = await uploadFile(file);
        const result = await addContentBlockAction(courseId, lessonId, {
          type: "FILE",
          mediaUrl: url,
          fileName: name,
          fileSize: size,
        });
        if (result?.error) throw new Error(result.error);
        setMode(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  }

  function handleVideo() {
    // Paste-a-link path: normalize YouTube/Vimeo share URLs to embeds.
    if (videoSource === "link") {
      const normalized = normalizeVideoUrl(url);
      if (!normalized) {
        setError("Enter a video link or switch to Upload.");
        return;
      }
      submit({ type: "VIDEO", mediaUrl: normalized });
      return;
    }
    // Upload path: stream the file straight to storage, then save the URL.
    const file = videoRef.current?.files?.[0];
    if (!file) {
      setError("Choose a video file to upload.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const { url: publicUrl } = await uploadVideo(file);
        const result = await addContentBlockAction(courseId, lessonId, {
          type: "VIDEO",
          mediaUrl: publicUrl,
        });
        if (result?.error) throw new Error(result.error);
        setMode(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  }

  if (mode === null) {
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setMode("TEXT")}>
          <FileText /> Add text
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMode("VIDEO")}>
          <Video /> Add video
        </Button>
        <Button variant="outline" size="sm" onClick={() => setMode("FILE")}>
          <Paperclip /> Add file
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border p-3">
      {mode === "TEXT" && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Lesson text (HTML or Markdown supported)…"
          aria-label="Text content"
        />
      )}
      {mode === "VIDEO" && (
        <div className="space-y-2">
          {videoUploadEnabled && (
            <div className="flex gap-2" role="tablist" aria-label="Video source">
              <Button
                type="button"
                size="sm"
                variant={videoSource === "upload" ? "default" : "outline"}
                aria-pressed={videoSource === "upload"}
                onClick={() => {
                  setVideoSource("upload");
                  setError(null);
                }}
              >
                Upload file
              </Button>
              <Button
                type="button"
                size="sm"
                variant={videoSource === "link" ? "default" : "outline"}
                aria-pressed={videoSource === "link"}
                onClick={() => {
                  setVideoSource("link");
                  setError(null);
                }}
              >
                Paste link
              </Button>
            </div>
          )}
          {videoSource === "upload" && videoUploadEnabled ? (
            <>
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                aria-label="Video file to upload"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Uploads directly to storage; large files may take a while.
              </p>
            </>
          ) : (
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube, Google Drive, Vimeo, or direct video URL"
              aria-label="Video URL"
              type="url"
            />
          )}
        </div>
      )}
      {mode === "FILE" && (
        <input
          ref={fileRef}
          type="file"
          aria-label="File to upload"
          className="text-sm"
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => {
            if (mode === "TEXT") submit({ type: "TEXT", text });
            else if (mode === "VIDEO") handleVideo();
            else handleFile();
          }}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setMode(null);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
