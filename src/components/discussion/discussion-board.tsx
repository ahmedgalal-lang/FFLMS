"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Megaphone, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createThreadAction,
  createAnnouncementAction,
} from "@/app/(learn)/discussions/actions";

type Thread = {
  id: string;
  title: string;
  createdAt: Date;
  author: { name: string };
  _count: { posts: number };
};
type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  author: { name: string };
};

export function DiscussionBoard({
  slug,
  courseId,
  isInstructor,
  threads,
  announcements,
}: {
  slug: string;
  courseId: string;
  isInstructor: boolean;
  threads: Thread[];
  announcements: Announcement[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);

  return (
    <div className="space-y-8">
      {/* Announcements */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Megaphone className="h-4 w-4" /> Announcements
          </h2>
          {isInstructor && (
            <Button size="sm" variant="outline" onClick={() => setShowAnnounce((v) => !v)}>
              <Plus /> New
            </Button>
          )}
        </div>

        {showAnnounce && isInstructor && (
          <form
            className="space-y-2 rounded-lg border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setError(null);
              startTransition(async () => {
                const res = await createAnnouncementAction(slug, {
                  courseId,
                  title: fd.get("title"),
                  body: fd.get("body"),
                });
                if (res?.error) setError(res.error);
                else {
                  setShowAnnounce(false);
                  router.refresh();
                }
              });
            }}
          >
            <Input name="title" placeholder="Announcement title" required minLength={3} />
            <Textarea name="body" placeholder="Message to all enrolled students…" required />
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Post announcement
            </Button>
          </form>
        )}

        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-lg border bg-amber-50/50 p-4">
                <p className="font-medium">{a.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.author.name} · {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Threads */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4" /> Questions &amp; discussion
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowThread((v) => !v)}>
            <Plus /> New thread
          </Button>
        </div>

        {showThread && (
          <form
            className="space-y-2 rounded-lg border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setError(null);
              startTransition(async () => {
                const res = await createThreadAction(slug, {
                  courseId,
                  title: fd.get("title"),
                  body: fd.get("body"),
                });
                if (res?.error) setError(res.error);
              });
            }}
          >
            <Input name="title" placeholder="What's your question?" required minLength={3} />
            <Textarea name="body" placeholder="Add details…" required />
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Post
            </Button>
          </form>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        {threads.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No questions yet — start the conversation.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {threads.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/discussions/${t.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.author.name} · {t._count.posts} post{t._count.posts === 1 ? "" : "s"}
                    </p>
                  </div>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
