import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { listNotifications } from "@/server/services/notification";
import { parsePagination } from "@/server/http";
import { Badge } from "@/components/ui/badge";
import { MarkAllRead } from "@/components/notifications/mark-all-read";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const principal = await requirePrincipal();
  const { items, unread } = await listNotifications(
    principal,
    parsePagination(new URLSearchParams({ pageSize: "50" })),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unread > 0 && (
            <p className="text-sm text-muted-foreground">{unread} unread</p>
          )}
        </div>
        {unread > 0 && <MarkAllRead />}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Bell className="mx-auto h-8 w-8" />
          <p className="mt-2">You&apos;re all caught up.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((n) => {
            const content = (
              <div className="flex items-start gap-3 p-4">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-primary"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.readAt && <Badge variant="secondary">new</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.linkUrl ? (
                  <Link href={n.linkUrl} className="block hover:bg-muted/50">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
