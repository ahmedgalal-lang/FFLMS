import Link from "next/link";
import { auth, signOut } from "@/server/auth";
import { Button, ButtonLink } from "@/components/ui";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  const homeByRole =
    user?.role === "INSTRUCTOR"
      ? "/studio"
      : user?.role === "ADMIN"
        ? "/studio"
        : "/my-learning";

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-ink"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" width="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">Lumen LMS</span>
        </Link>

        <nav className="flex items-center gap-2">
          <ButtonLink href="/courses" variant="ghost" size="sm">
            Catalog
          </ButtonLink>
          {user ? (
            <>
              <ButtonLink href={homeByRole} variant="ghost" size="sm">
                {user.role === "STUDENT" ? "My Learning" : "Studio"}
              </ButtonLink>
              <span className="hidden text-sm text-ink-2 sm:inline">
                {user.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button variant="secondary" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/sign-in" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" variant="primary" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
