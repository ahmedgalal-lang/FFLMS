"use client";

import { useActionState } from "react";
import { Button, Card, Field } from "@/components/ui";
import { createCourseAction, type ActionState } from "../actions";

export function NewCourseForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createCourseAction,
    {},
  );

  return (
    <Card className="p-6">
      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Course title" name="title" required placeholder="Foundations of Data Analysis" />
        <Field label="Short summary" name="summary" required placeholder="Go from raw data to a defensible insight." />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-3">
            Description
          </span>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="What learners will be able to do by the end…"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-3">
            Category
          </span>
          <select
            name="categoryId"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            defaultValue=""
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {state.error ? (
          <p className="text-sm text-[color:var(--critical)]" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create course"}
        </Button>
      </form>
    </Card>
  );
}
