import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Award, CheckCircle2, XCircle } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { db } from "@/server/db";
import { getMyGrades } from "@/server/services/gradebook";
import { listMyCertificates } from "@/server/services/certificate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My grades" };

export default async function MyGradesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const principal = await requirePrincipal();

  const course = await db.course.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!course) notFound();

  const [{ attempts, submissions }, certificates] = await Promise.all([
    getMyGrades(principal, course.id),
    listMyCertificates(principal),
  ]);
  const certificate = certificates.find((c) => c.course.slug === slug);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/learn/${slug}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-bold">My grades · {course.title}</h1>
      </div>

      {/* Certificate */}
      {certificate && !certificate.revokedAt && (
        <div className="flex items-center gap-4 rounded-lg border border-green-300 bg-green-50 p-5">
          <Award className="h-10 w-10 text-green-600" />
          <div className="flex-1">
            <p className="font-semibold text-green-900">Certificate earned</p>
            <p className="text-sm text-green-800">
              Code: <code>{certificate.verificationCode}</code>
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={`/api/certificates/${certificate.verificationCode}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/verify/${certificate.verificationCode}`}>Verify</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Quizzes */}
      <section className="space-y-2">
        <h2 className="font-semibold">Quizzes</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quiz attempts yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {attempts.map((a, i) => (
              <li key={i} className="flex items-center justify-between p-3 text-sm">
                <span>{a.quiz.title}</span>
                <span className="flex items-center gap-2">
                  {a.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="tabular-nums font-medium">{a.score}%</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Assignments */}
      <section className="space-y-2">
        <h2 className="font-semibold">Assignments</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {submissions.map((s, i) => (
              <li key={i} className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>{s.assignment.title}</span>
                  {s.status === "GRADED" ? (
                    <span className="tabular-nums font-medium">
                      {s.score}/{s.assignment.maxPoints}
                    </span>
                  ) : (
                    <Badge variant="secondary">{s.status.toLowerCase()}</Badge>
                  )}
                </div>
                {s.feedback && (
                  <p className="mt-1 text-muted-foreground">{s.feedback}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
