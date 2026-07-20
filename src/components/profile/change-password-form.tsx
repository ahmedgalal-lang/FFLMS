"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/app/(learn)/profile/actions";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<{ ok?: boolean; text: string } | null>(null);

  if (!hasPassword) {
    return (
      <section className="space-y-2 rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Password</h2>
        <p className="text-sm text-muted-foreground">
          Your account uses a social login, so there&apos;s no password to change.
        </p>
      </section>
    );
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const res = await changePasswordAction({
        currentPassword: current,
        newPassword: next,
      });
      if (res?.error) setMessage({ text: res.error });
      else {
        setMessage({ ok: true, text: "Password changed." });
        setCurrent("");
        setNext("");
      }
    });
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="font-semibold">Change password</h2>
      <div className="space-y-2">
        <Label htmlFor="current">Current password</Label>
        <Input
          id="current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next">New password</Label>
        <Input
          id="next"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </div>

      {message && (
        <p className={message.ok ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {message.text}
        </p>
      )}

      <Button onClick={submit} disabled={pending || !current || next.length < 8}>
        {pending ? <Loader2 className="animate-spin" /> : null} Update password
      </Button>
    </section>
  );
}
