import { handlers } from "@/server/auth";

// Auth uses bcrypt + Prisma → Node.js runtime, evaluated per-request only.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
