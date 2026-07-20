"use client";

import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";

const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: Role;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-tight">{name}</p>
        <p className="text-xs text-muted-foreground">
          {roleLabel[role]} · {email}
        </p>
      </div>
      <form action="/sign-out" method="post">
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}
