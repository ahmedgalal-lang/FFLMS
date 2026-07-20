import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CatalogCourse = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImageUrl: string | null;
  instructor: { name: string };
  category: { name: string; slug: string } | null;
  _count: { enrollments: number };
};

export function CourseCard({ course }: { course: CatalogCourse }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary"
    >
      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        {course.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-3xl font-bold text-primary/30">
            {course.title.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {course.category && (
          <Badge variant="secondary" className="mb-2 w-fit">
            {course.category.name}
          </Badge>
        )}
        <h3 className="font-semibold leading-tight group-hover:text-primary">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {course.summary}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{course.instructor.name}</span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {course._count.enrollments}
          </span>
        </div>
      </div>
    </Link>
  );
}
