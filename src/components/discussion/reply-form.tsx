"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addPostAction } from "@/app/(learn)/discussions/actions";

export function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-2 border-t pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setError(null);
        startTransition(async () => {
          const res = await addPostAction(threadId, body);
          if (res?.error) setError(res.error);
          else {
            setBody("");
            router.refresh();
          }
        });
      }}
    >
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply…"
        aria-label="Reply"
        required
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending || !body.trim()}>
        {pending ? <Loader2 className="animate-spin" /> : null} Reply
      </Button>
    </form>
  );
}
