"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignCourseToStudentAction,
  revokeCourseFromStudentAction,
} from "@/app/(teach)/studio/[courseId]/assign/actions";

type Assignment = {
  studentId: string;
  name: string;
  email: string;
  assignedAt: string;
};

export function AssignPanel({
  courseId,
  courseStatus,
  assignments,
}: {
  courseId: string;
  courseStatus: string;
  assignments: Assignment[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function assign() {
    setError(null);
    startTransition(async () => {
      const res = await assignCourseToStudentAction(courseId, email);
      if (res?.error) {
        setError(res.error);
      } else {
        setEmail("");
        router.refresh();
      }
    });
  }

  function revoke(studentId: string) {
    setError(null);
    startTransition(async () => {
      const res = await revokeCourseFromStudentAction(courseId, studentId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {courseStatus !== "PUBLISHED" && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          This course must be published before it can be assigned to
          students.
        </p>
      )}

      <div className="rounded-lg border bg-card p-5">
        <Label htmlFor="assign-email">Assign by email</Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="assign-email"
            type="email"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                assign();
              }
            }}
            disabled={pending || courseStatus !== "PUBLISHED"}
          />
          <Button
            onClick={assign}
            disabled={pending || !email.trim() || courseStatus !== "PUBLISHED"}
          >
            {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
            Assign
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {assignments.length} student{assignments.length === 1 ? "" : "s"}{" "}
          assigned
        </h2>
        {assignments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No students assigned yet.
          </p>
        ) : (
          <div className="divide-y rounded-lg border">
            {assignments.map((a) => (
              <div
                key={a.studentId}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => revoke(a.studentId)}
                  aria-label={`Revoke ${a.name}'s access`}
                >
                  <X /> Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
