"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { enrollAction } from "@/app/(marketing)/courses/actions";

export function EnrollButton({
  courseId,
  courseSlug,
}: {
  courseId: string;
  courseSlug: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await enrollAction(courseId, courseSlug);
            if (res?.error) setError(res.error);
          })
        }
      >
        {pending ? "Enrolling…" : "Enrol — it's free"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
