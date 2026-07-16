import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton, lazily constructed. Building the client is deferred
 * until first use so that `next build` (static page collection) never
 * instantiates it — avoiding spurious "DATABASE_URL not found" logs when the
 * database isn't configured at build time.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["warn", "error"]
          : ["error"],
    });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

let instance: PrismaClient | undefined;

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    instance ??= createClient();
    return Reflect.get(instance, prop, receiver);
  },
});
