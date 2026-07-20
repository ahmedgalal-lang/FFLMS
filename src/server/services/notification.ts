import type { NotificationType } from "@prisma/client";
import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import type { PageParams } from "@/server/http";

/**
 * Notification fan-out + reads (FR-028). `notify`/`notifyMany` are the single
 * entry points other services use to create notifications; reads are always
 * scoped to the acting principal.
 */

type NewNotification = {
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string | null;
};

export async function notify(userId: string, n: NewNotification) {
  return db.notification
    .create({
      data: {
        userId,
        type: n.type,
        title: n.title,
        body: n.body,
        linkUrl: n.linkUrl ?? null,
      },
    })
    .catch(() => undefined); // best-effort; never block the triggering action
}

export async function notifyMany(userIds: string[], n: NewNotification) {
  if (userIds.length === 0) return;
  await db.notification
    .createMany({
      data: userIds.map((userId) => ({
        userId,
        type: n.type,
        title: n.title,
        body: n.body,
        linkUrl: n.linkUrl ?? null,
      })),
    })
    .catch(() => undefined);
}

export async function listNotifications(principal: Principal, page: PageParams) {
  const [items, total, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: principal.id },
      orderBy: { createdAt: "desc" },
      skip: page.skip,
      take: page.pageSize,
    }),
    db.notification.count({ where: { userId: principal.id } }),
    db.notification.count({ where: { userId: principal.id, readAt: null } }),
  ]);
  return { items, total, unread };
}

export async function unreadCount(principal: Principal) {
  return db.notification.count({
    where: { userId: principal.id, readAt: null },
  });
}

export async function markRead(principal: Principal, notificationId: string) {
  // updateMany scoped by userId so a user can only mark their own as read.
  await db.notification.updateMany({
    where: { id: notificationId, userId: principal.id, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(principal: Principal) {
  await db.notification.updateMany({
    where: { userId: principal.id, readAt: null },
    data: { readAt: new Date() },
  });
}
