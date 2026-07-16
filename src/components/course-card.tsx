import Link from "next/link";
import { Badge } from "@/components/ui";

type CourseCardData = {
  slug: string;
  title: string;
  summary: string;
  category: { name: string } | null;
  instructor: { name: string };
  _count?: { enrollments: number };
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col rounded-xl border border-line bg-surface shadow-sm transition-colors hover:border-brand"
    >
      <div
        className="aspect-[16/9] rounded-t-xl bg-gradient-to-br from-brand-soft to-surface-2"
        aria-hidden
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          {course.category ? (
            <Badge tone="brand">{course.category.name}</Badge>
          ) : null}
        </div>
        <h3 className="font-semibold leading-snug tracking-tight text-balance group-hover:text-brand-strong">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-ink-2">
          {course.summary}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-ink-3">
          <span>{course.instructor.name}</span>
          {course._count ? (
            <span className="tnum">{course._count.enrollments} enrolled</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
