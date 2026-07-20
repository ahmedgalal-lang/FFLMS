"use server";

import { revalidatePath } from "next/cache";
import { requirePrincipal } from "@/server/auth";
import { markRead, markAllRead } from "@/server/services/notification";

export async function markReadAction(notificationId: string) {
  const principal = await requirePrincipal();
  await markRead(principal, notificationId);
  revalidatePath("/notifications");
}

export async function markAllReadAction() {
  const principal = await requirePrincipal();
  await markAllRead(principal);
  revalidatePath("/notifications");
}
