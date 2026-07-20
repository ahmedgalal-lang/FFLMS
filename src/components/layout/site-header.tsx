import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getPrincipal } from "@/server/auth";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";

/** Role-aware primary navigation. UI hiding is cosmetic — server still guards. */
export async function SiteHeader() {
  const principal = await getPrincipal();
  const user = principal
    ? await db.user.findUnique({
        where: { id: principal.id },
        select: { name: true, email: true, role: true, avatarUrl: true },
      })
    : null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">LMS Platform</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/courses" className="text-muted-foreground hover:text-foreground">
              Catalog
            </Link>
            {user && (
              <Link
                href="/my-learning"
                className="text-muted-foreground hover:text-foreground"
              >
                My Learning
              </Link>
            )}
            {user?.role === "INSTRUCTOR" && (
              <Link
                href="/studio"
                className="text-muted-foreground hover:text-foreground"
              >
                Studio
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {user ? (
          <UserMenu
            name={user.name}
            email={user.email}
            role={user.role}
            avatarUrl={user.avatarUrl}
          />
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
    </header>
  );
}
