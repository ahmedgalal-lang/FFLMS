import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Link
        href="/"
        className="mb-6 flex items-center gap-2 text-lg font-semibold"
      >
        <GraduationCap className="h-6 w-6 text-primary" />
        LMS Platform
      </Link>
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
