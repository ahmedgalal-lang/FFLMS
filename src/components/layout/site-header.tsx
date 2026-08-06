import Link from "next/link";
import { GraduationCap, Bell } from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";

type HeaderUser = {
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
} | null;

/** Presentational top bar. Primary nav lives in the sidebar (sm+) or the row below (mobile). */
export function SiteHeader({ user, unread }: { user: HeaderUser; unread: number }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {user && <SidebarToggle />}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 font-semibold"
          >
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">LMS Platform</span>
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link href="/notifications" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </Button>
            <UserMenu
              name={user.name}
              email={user.email}
              role={user.role}
              avatarUrl={user.avatarUrl}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Sidebar covers sm+; this row is the mobile fallback nav. */}
      {user && (
        <nav className="container flex items-center gap-4 overflow-x-auto border-t py-2 text-sm sm:hidden">
          <Link href="/courses" className="whitespace-nowrap text-muted-foreground hover:text-foreground">
            Catalog
          </Link>
          <Link href="/my-learning" className="whitespace-nowrap text-muted-foreground hover:text-foreground">
            My Learning
          </Link>
          {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
            <Link href="/studio" className="whitespace-nowrap text-muted-foreground hover:text-foreground">
              Studio
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link href="/admin" className="whitespace-nowrap text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
