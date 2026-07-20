"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, UserStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { changeRoleAction, setStatusAction } from "@/app/(admin)/admin/actions";

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

  return (
    <tr className="border-b last:border-0 align-top">
      <td className="p-3">
        <div className="font-medium">
          {user.name} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
        </div>
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
      </td>
    </tr>
  );
}
