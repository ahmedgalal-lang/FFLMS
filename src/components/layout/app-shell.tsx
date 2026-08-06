import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { getPrincipal } from "@/server/auth";
import { db } from "@/server/db";
import { unreadCount } from "@/server/services/notification";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const principal = await getPrincipal();
  const [user, unread] = await Promise.all([
    principal
      ? db.user.findUnique({
          where: { id: principal.id },
          select: { name: true, email: true, role: true, avatarUrl: true },
        })
      : Promise.resolve(null),
    principal ? unreadCount(principal) : Promise.resolve(0),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader user={user} unread={unread} />
      <div className="flex flex-1">
        {user && <SidebarNav role={user.role} />}
        <main id="main" className="container flex-1 py-8">
          {children}
        </main>
      </div>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        LMS Platform · Built with Next.js ·{" "}
        <Link href="/verify" className="hover:text-foreground hover:underline">
          Verify a certificate
        </Link>
      </footer>
    </div>
  );
}
