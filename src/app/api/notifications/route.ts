import { NextRequest, NextResponse } from "next/server";
import { route, parsePagination, pageMeta } from "@/server/http";
import { requirePrincipal } from "@/server/auth";
import { listNotifications } from "@/server/services/notification";

/** GET /api/notifications — the acting user's notifications. */
export const GET = route(async (req: NextRequest) => {
  const principal = await requirePrincipal();
  const pagination = parsePagination(req.nextUrl.searchParams, {
    defaultSize: 20,
  });
  const { items, total, unread } = await listNotifications(principal, pagination);
  return NextResponse.json({ items, unread, ...pageMeta(total, pagination) });
});
