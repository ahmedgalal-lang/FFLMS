"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  X,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { CourseStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  setCourseCategoryAction,
} from "@/app/(admin)/admin/actions";

type CategoryCourse = { id: string; title: string; status: CourseStatus };
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  courses: CategoryCourse[];
};

const statusVariant: Record<
  CourseStatus,
  "default" | "secondary" | "success" | "warning"
> = {
  DRAFT: "secondary",
  IN_REVIEW: "warning",
  PUBLISHED: "success",
  ARCHIVED: "secondary",
};

export function CategoryManager({
  categories,
  uncategorized,
}: {
  categories: Category[];
  uncategorized: CategoryCourse[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function run(fn: () => Promise<{ error?: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const ids = categories.map((c) => c.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    run(() => reorderCategoriesAction(ids));
  }

  function startEdit(c: Category) {
    setError(null);
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(c.description ?? "");
  }

  function saveEdit(categoryId: string) {
    if (!editName.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await updateCategoryAction(categoryId, {
        name: editName,
        description: editDescription.trim() || null,
      });
      if (res?.error) setError(res.error);
      else {
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function courseList(courses: CategoryCourse[], currentCategoryId: string | null) {
    return (
      <ul className="divide-y border-t bg-muted/30">
        {courses.map((course) => (
          <li
            key={course.id}
            className="flex items-center justify-between gap-3 py-2 pl-9 pr-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm">{course.title}</span>
              <Badge variant={statusVariant[course.status]}>
                {course.status.toLowerCase().replace("_", " ")}
              </Badge>
            </div>
            <select
              value={currentCategoryId ?? ""}
              aria-label={`Category for ${course.title}`}
              disabled={pending}
              className="h-8 shrink-0 rounded-md border border-input bg-background px-2 text-sm"
              onChange={(e) =>
                run(() =>
                  setCourseCategoryAction(course.id, e.target.value || null),
                )
              }
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const value = name;
          setName("");
          run(() => createCategoryAction({ name: value }));
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          aria-label="New category name"
          className="max-w-xs"
        />
        <Button type="submit" disabled={pending}>
          <Plus /> Add
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {categories.length > 0 && (
        <p className="text-xs text-muted-foreground">
          This order controls the section order on the public catalog — first
          umbrella first. Expand a category to see and move its courses.
        </p>
      )}
      <div className="divide-y rounded-lg border">
        {categories.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No categories yet.</p>
        )}
        {categories.map((c, i) =>
          editingId === c.id ? (
            <div key={c.id} className="space-y-2 p-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Category name"
                aria-label={`Edit name for ${c.name}`}
              />
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                aria-label={`Edit description for ${c.name}`}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => setEditingId(null)}
                >
                  <X /> Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={pending || !editName.trim()}
                  onClick={() => saveEdit(c.id)}
                >
                  <Check /> Save
                </Button>
              </div>
            </div>
          ) : (
            <div key={c.id}>
              <div className="flex items-center justify-between p-3">
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2 text-left"
                  onClick={() => toggleExpanded(c.id)}
                  aria-expanded={!!expanded[c.id]}
                  aria-label={`${expanded[c.id] ? "Collapse" : "Expand"} ${c.name}`}
                >
                  {expanded[c.id] ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0">
                    <span className="font-medium">{c.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.courses.length} course{c.courses.length === 1 ? "" : "s"}
                    </span>
                    {c.description && (
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    )}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${c.name} up`}
                    disabled={pending || i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${c.name} down`}
                    disabled={pending || i === categories.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${c.name}`}
                    disabled={pending}
                    onClick={() => startEdit(c)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${c.name}`}
                    disabled={pending}
                    onClick={() => run(() => deleteCategoryAction(c.id))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              {expanded[c.id] &&
                (c.courses.length > 0 ? (
                  courseList(c.courses, c.id)
                ) : (
                  <p className="border-t bg-muted/30 py-2 pl-9 pr-3 text-sm text-muted-foreground">
                    No courses in this category yet.
                  </p>
                ))}
            </div>
          ),
        )}
      </div>

      {uncategorized.length > 0 && (
        <div className="rounded-lg border">
          <button
            type="button"
            className="flex w-full items-center gap-2 p-3 text-left"
            onClick={() => toggleExpanded("__uncategorized")}
            aria-expanded={!!expanded.__uncategorized}
            aria-label={`${expanded.__uncategorized ? "Collapse" : "Expand"} Uncategorized`}
          >
            {expanded.__uncategorized ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="font-medium">Uncategorized</span>
            <span className="text-xs text-muted-foreground">
              {uncategorized.length} course{uncategorized.length === 1 ? "" : "s"} —
              not assigned to any umbrella yet
            </span>
          </button>
          {expanded.__uncategorized && courseList(uncategorized, null)}
        </div>
      )}
    </div>
  );
}
