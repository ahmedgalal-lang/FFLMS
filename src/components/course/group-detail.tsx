"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, BookPlus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addGroupMemberAction,
  removeGroupMemberAction,
  assignCourseToGroupAction,
  revokeCourseFromGroupAction,
  deleteGroupAction,
} from "@/app/(teach)/studio/groups/actions";

type Member = { studentId: string; name: string; email: string };
type AssignedCourse = { courseId: string; title: string };
type AssignableCourse = { id: string; title: string };

export function GroupDetail({
  groupId,
  members,
  assignedCourses,
  assignableCourses,
}: {
  groupId: string;
  members: Member[];
  assignedCourses: AssignedCourse[];
  assignableCourses: AssignableCourse[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function addMember() {
    setError(null);
    startTransition(async () => {
      const res = await addGroupMemberAction(groupId, email);
      if (res?.error) setError(res.error);
      else {
        setEmail("");
        router.refresh();
      }
    });
  }

  function removeMember(studentId: string) {
    setError(null);
    startTransition(async () => {
      const res = await removeGroupMemberAction(groupId, studentId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function assignCourse() {
    setError(null);
    startTransition(async () => {
      const res = await assignCourseToGroupAction(groupId, courseId);
      if (res?.error) setError(res.error);
      else {
        setCourseId("");
        router.refresh();
      }
    });
  }

  function revokeCourse(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await revokeCourseFromGroupAction(groupId, id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function removeGroup() {
    setError(null);
    startTransition(async () => {
      const res = await deleteGroupAction(groupId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Members */}
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-5">
          <Label htmlFor="group-member-email">Add member by email</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="group-member-email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
            <Button onClick={addMember} disabled={pending || !email.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : <UserPlus />}
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {members.length} member{members.length === 1 ? "" : "s"}
          </h2>
          {members.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No members yet.
            </p>
          ) : (
            <div className="divide-y rounded-lg border">
              {members.map((m) => (
                <div
                  key={m.studentId}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => removeMember(m.studentId)}
                    aria-label={`Remove ${m.name} from this group`}
                  >
                    <X /> Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Courses */}
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-5">
          <Label htmlFor="group-course">Assign a course to this group</Label>
          <div className="mt-2 flex gap-2">
            <select
              id="group-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={pending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Choose a restricted, published course —</option>
              {assignableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <Button onClick={assignCourse} disabled={pending || !courseId}>
              {pending ? <Loader2 className="animate-spin" /> : <BookPlus />}
              Assign
            </Button>
          </div>
          {assignableCourses.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              No eligible courses — mark a published course Restricted in its
              settings first.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {assignedCourses.length} course
            {assignedCourses.length === 1 ? "" : "s"} assigned
          </h2>
          {assignedCourses.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No courses assigned yet.
            </p>
          ) : (
            <div className="divide-y rounded-lg border">
              {assignedCourses.map((c) => (
                <div
                  key={c.courseId}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <p className="font-medium">{c.title}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => revokeCourse(c.courseId)}
                    aria-label={`Revoke group access to ${c.title}`}
                  >
                    <X /> Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="lg:col-span-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="lg:col-span-2 rounded-md border border-destructive/40 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Danger zone</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Deleting a group removes it and its memberships. Members lose any
          access they only had through this group; their prior progress is
          preserved.
        </p>
        {confirmingDelete ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm">Are you sure?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={removeGroup}
              disabled={pending}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Yes, delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmingDelete(true)}
            disabled={pending}
          >
            <Trash2 /> Delete group
          </Button>
        )}
      </div>
    </div>
  );
}
