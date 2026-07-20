"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Video, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addContentBlockAction } from "@/app/(teach)/studio/actions";
import { uploadFile } from "@/lib/upload-client";

type Mode = null | "TEXT" | "VIDEO" | "FILE";

export function ContentBlockEditor({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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
        const { url, name, size } = await uploadFile(file, "lessons");
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
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/embed/…"
          aria-label="Video URL"
          type="url"
        />
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
            else if (mode === "VIDEO") submit({ type: "VIDEO", mediaUrl: url });
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
