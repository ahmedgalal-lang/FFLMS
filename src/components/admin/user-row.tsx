"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, UserStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  changeRoleAction,
  setStatusAction,
  updateUserInfoAction,
  setUserPasswordAction,
} from "@/app/(admin)/admin/actions";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  _count: { coursesAuthored: number; enrollments: number };
};

export function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  const suspended = user.status === "SUSPENDED";
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user.name);
  const [resetting, setResetting] = useState(false);
  const [newPass, setNewPass] = useState("");

  return (
    <tr className="border-b last:border-0 align-top">
      <td className="p-3">
        {editingName ? (
          <div className="flex items-center gap-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label={`Edit name for ${user.email}`}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            />
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const r = await updateUserInfoAction(user.id, { name });
                  if (!r?.error) setEditingName(false);
                  return r;
                })
              }
            >
              Save
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="text-left font-medium hover:underline"
            onClick={() => setEditingName(true)}
            title="Click to edit name"
          >
            {user.name}
          </button>
        )}
        {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
        <div className="text-xs text-muted-foreground">{user.email}</div>
        {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
      </td>
      <td className="p-3">
        <select
          value={user.role}
          disabled={pending || isSelf}
          aria-label={`Role for ${user.name}`}
          onChange={(e) => run(() => changeRoleAction(user.id, e.target.value as Role))}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60"
        >
          <option value="ADMIN">Admin</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="STUDENT">Student</option>
        </select>
      </td>
      <td className="p-3">
        <Badge variant={suspended ? "destructive" : "success"}>
          {user.status.toLowerCase()}
        </Badge>
      </td>
      <td className="p-3 text-xs text-muted-foreground">
        {user._count.coursesAuthored} authored · {user._count.enrollments} enrolled
      </td>
      <td className="p-3">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            variant={suspended ? "outline" : "destructive"}
            size="sm"
            disabled={pending || isSelf}
            onClick={() =>
              run(() => setStatusAction(user.id, suspended ? "ACTIVE" : "SUSPENDED"))
            }
          >
            {suspended ? "Reactivate" : "Suspend"}
          </Button>
          {resetting ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="New password"
                aria-label={`New password for ${user.email}`}
                className="h-8 w-32 rounded-md border border-input bg-background px-2 text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                disabled={pending || newPass.length < 8}
                onClick={() =>
                  run(async () => {
                    const r = await setUserPasswordAction(user.id, { newPassword: newPass });
                    if (!r?.error) {
                      setResetting(false);
                      setNewPass("");
                    }
                    return r;
                  })
                }
              >
                Set
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setResetting(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setResetting(true)}>
              Reset password
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
