"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Card, Field } from "@/components/ui";
import type { AuthState } from "./actions";

type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export function SignInForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <Card className="p-6">
      <h1 className="text-lg font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-2">Sign in to keep learning.</p>
      <form action={formAction} className="mt-5 flex flex-col gap-4">
        <Field label="Email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        <Field label="Password" name="password" type="password" required autoComplete="current-password" />
        {state.error ? (
          <p className="text-sm text-[color:var(--critical)]" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-2">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-strong">
          Create an account
        </Link>
      </p>
      <p className="mt-3 rounded-lg bg-surface-2 p-3 text-center text-xs text-ink-3">
        Demo: student@example.com · Password123!
      </p>
    </Card>
  );
}

export function RegisterForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <Card className="p-6">
      <h1 className="text-lg font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-ink-2">Start learning or teaching today.</p>
      <form action={formAction} className="mt-5 flex flex-col gap-4">
        <Field label="Name" name="name" required autoComplete="name" placeholder="Jordan Tan" />
        <Field label="Email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        <Field label="Password" name="password" type="password" required autoComplete="new-password" placeholder="At least 8 characters" />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-3">
            I want to
          </span>
          <select
            name="role"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            defaultValue="STUDENT"
          >
            <option value="STUDENT">Learn (Student)</option>
            <option value="INSTRUCTOR">Teach (Instructor)</option>
          </select>
        </label>
        {state.error ? (
          <p className="text-sm text-[color:var(--critical)]" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-2">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-brand-strong">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
