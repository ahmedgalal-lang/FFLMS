import Link from "next/link";
import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { getGradebook } from "@/server/services/gradebook";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Gradebook" };

function cellColor(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct >= 70) return "text-green-700";
  if (pct >= 40) return "text-amber-600";
  return "text-destructive";
}

export default async function GradebookPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const principal = await requirePrincipal();
  const gb = await getGradebook(principal, courseId);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/studio/${courseId}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Gradebook · {gb.course.title}</h1>
        <p className="text-sm text-muted-foreground">
          {gb.rows.length} enrolled · {gb.assessments.length} assessments
        </p>
      </div>

      {gb.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No students are enrolled yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Student</th>
                <th className="p-3 font-medium">Progress</th>
                {gb.assessments.map((a) => (
                  <th key={a.id} className="p-3 font-medium">
                    <div className="flex items-center gap-1">
                      <span>{a.title}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {a.kind === "QUIZ" ? "quiz" : "asg"}
                      </Badge>
                    </div>
                  </th>
                ))}
                <th className="p-3 font-medium">Average</th>
              </tr>
            </thead>
            <tbody>
              {gb.rows.map((row) => (
                <tr key={row.student.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="font-medium">{row.student.name}</div>
                    <div className="text-xs text-muted-foreground">{row.student.email}</div>
                  </td>
                  <td className="p-3">
                    <span className="tabular-nums">{row.progressPercent}%</span>
                    {row.status === "COMPLETED" && (
                      <Badge variant="success" className="ml-2 text-[10px]">done</Badge>
                    )}
                  </td>
                  {gb.assessments.map((a) => {
                    const cell = row.cells[a.id];
                    return (
                      <td key={a.id} className={`p-3 tabular-nums ${cellColor(cell?.percent ?? null)}`}>
                        {cell?.label ?? "—"}
                      </td>
                    );
                  })}
                  <td className={`p-3 font-semibold tabular-nums ${cellColor(row.average)}`}>
                    {row.average == null ? "—" : `${row.average}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
