import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-ground px-5 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2.5"
        >
          <span
            className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-ink"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" width="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
            </svg>
          </span>
          <span className="text-xl font-semibold tracking-tight">Lumen LMS</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
