"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, CheckCircle2, Clock, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { uploadFile } from "@/lib/upload-client";

type AssignmentInfo = {
  id: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  allowText: boolean;
  allowFile: boolean;
  maxPoints: number;
};
type MySubmission = {
  id: string;
  text: string | null;
  fileUrl: string | null;
  status: string;
  isLate: boolean;
  score: number | null;
  feedback: string | null;
} | null;

export function AssignmentPanel({
  assignment,
  submission,
}: {
  assignment: AssignmentInfo;
  submission: MySubmission;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(submission?.text ?? "");
  const [fileUrl, setFileUrl] = useState<string | null>(submission?.fileUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const graded = submission?.status === "GRADED";

  async function handleFileUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { url, name } = await uploadFile(file, "submissions");
      setFileUrl(url);
      setFileName(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/assignments/${assignment.id}/submissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text || null, fileUrl, fileName }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? "Could not submit.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not submit.");
      }
    });
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{assignment.title}</h3>
        </div>
        {assignment.dueAt && (
          <span className="text-xs text-muted-foreground">
            Due {new Date(assignment.dueAt).toLocaleString()}
          </span>
        )}
      </div>

      {assignment.instructions && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {assignment.instructions}
        </p>
      )}

      {/* Graded result */}
      {graded && (
        <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            Graded: {submission!.score}/{assignment.maxPoints}
          </p>
          {submission!.feedback && (
            <p className="mt-1 text-green-900">{submission!.feedback}</p>
          )}
        </div>
      )}

      {/* Status badges */}
      {submission && (
        <div className="flex gap-2">
          <Badge variant={graded ? "success" : "secondary"}>
            {submission.status.toLowerCase()}
          </Badge>
          {submission.isLate && (
            <Badge variant="warning">
              <Clock className="mr-1 h-3 w-3" /> late
            </Badge>
          )}
        </div>
      )}

      {/* Submission form (resubmission clears the grade server-side) */}
      {assignment.allowText && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your answer…"
          aria-label="Submission text"
          className="min-h-[120px]"
        />
      )}
      {assignment.allowFile && (
        <div className="space-y-1">
          <input
            type="file"
            aria-label="Attach a file"
            className="text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />
          {fileUrl && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" /> {fileName ?? "Attached file"}
            </p>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={pending || uploading}>
        {(pending || uploading) && <Loader2 className="animate-spin" />}
        {submission ? "Resubmit" : "Submit assignment"}
      </Button>
    </div>
  );
}
