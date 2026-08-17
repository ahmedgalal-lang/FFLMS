"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
} from "@/app/(admin)/admin/actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { courses: number };
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

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
          umbrella first.
        </p>
      )}
      <ul className="divide-y rounded-lg border">
        {categories.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">No categories yet.</li>
        )}
        {categories.map((c, i) => (
          <li key={c.id} className="flex items-center justify-between p-3">
            <div>
              <span className="font-medium">{c.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {c._count.courses} course{c._count.courses === 1 ? "" : "s"}
              </span>
            </div>
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
                aria-label={`Delete ${c.name}`}
                disabled={pending}
                onClick={() => run(() => deleteCategoryAction(c.id))}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
