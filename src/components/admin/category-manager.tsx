"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategoryAction,
  updateCategoryAction,
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

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
        {categories.map((c, i) =>
          editingId === c.id ? (
            <li key={c.id} className="space-y-2 p-3">
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
            </li>
          ) : (
            <li key={c.id} className="flex items-center justify-between p-3">
              <div>
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {c._count.courses} course{c._count.courses === 1 ? "" : "s"}
                </span>
                {c.description && (
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                )}
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
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
