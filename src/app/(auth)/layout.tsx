import Link from "next/link";
import { GraduationCap, BookOpen, Sparkles, Award } from "lucide-react";

const highlights = [
  { icon: BookOpen, label: "Structured courses built by real instructors" },
  { icon: Sparkles, label: "Pick up right where you left off" },
  { icon: Award, label: "Earn a verifiable certificate on completion" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branded panel, hidden on small screens. */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-orange/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-brand-navy/70 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <Link
          href="/"
          className="relative flex items-center gap-2 text-lg font-semibold text-primary-foreground"
        >
          <GraduationCap className="h-7 w-7" />
          LMS Platform
        </Link>

        <div className="relative max-w-md space-y-8">
          <h1 className="text-4xl font-bold leading-tight text-primary-foreground">
            Learn anything.
            <br />
            Teach everything.
          </h1>
          <p className="text-primary-foreground/70">
            Structured courses, real progress tracking, and verifiable
            certificates — all in one place.
          </p>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex items-center gap-3 text-primary-foreground/90">
                <span
                  className={
                    i === 0
                      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange text-brand-navy"
                      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10"
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} LMS Platform
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center bg-background p-4">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 text-lg font-semibold lg:hidden"
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          LMS Platform
        </Link>
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
