"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  approveCourseAction,
  rejectCourseAction,
} from "@/app/(admin)/admin/actions";

type QueueCourse = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  instructor: { name: string; email: string };
  _count: { modules: number };
};

export function ReviewCard({ course }: { course: QueueCourse }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{course.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{course.summary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {course.instructor.name} · {course._count.modules} modules
          </p>
        </div>
        <Link
          href={`/courses/${course.slug}`}
          className="flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
        >
          Preview <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {rejecting ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (sent to instructor)"
            aria-label="Rejection reason"
            className="h-9 flex-1"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || !reason.trim()}
            onClick={() => run(() => rejectCourseAction(course.id, reason))}
          >
            Confirm reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button size="sm" disabled={pending} onClick={() => run(() => approveCourseAction(course.id))}>
            <Check /> Approve &amp; publish
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setRejecting(true)}>
            <X /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}
