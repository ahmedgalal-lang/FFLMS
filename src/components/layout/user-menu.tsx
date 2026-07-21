"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Role } from "@prisma/client";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const roleLabel: Record<Role, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

const dashboardHref: Record<Role, string> = {
  ADMIN: "/admin",
  INSTRUCTOR: "/studio",
  STUDENT: "/my-learning",
};

export function UserMenu({
  name,
  email,
  role,
  avatarUrl,
}: {
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <>
      {/* Lives outside the menu so it is not unmounted when the dropdown closes. */}
      <form ref={signOutForm} action="/sign-out" method="post" className="hidden" />
      <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar>
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div>{name}</div>
          <div className="text-xs font-normal text-muted-foreground">
            {roleLabel[role]} · {email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={dashboardHref[role]}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="h-4 w-4" /> Profile &amp; settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            signOutForm.current?.requestSubmit();
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
