import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { requirePrincipal } from "@/server/auth";
import { getThread } from "@/server/services/discussion";
import { NotFoundError } from "@/server/http";
import { AuthorizationError } from "@/server/access/policy";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ReplyForm } from "@/components/discussion/reply-form";

export const metadata: Metadata = { title: "Discussion" };

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const principal = await requirePrincipal();

  let thread;
  try {
    thread = await getThread(principal, threadId);
  } catch (err) {
    if (err instanceof AuthorizationError || err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/learn/${thread.course.slug}/discussions`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← {thread.course.title}
      </Link>
      <h1 className="text-2xl font-bold">{thread.title}</h1>

      <ul className="space-y-4">
        {thread.posts.map((post, i) => (
          <li
            key={post.id}
            className={`flex gap-3 rounded-lg border p-4 ${i === 0 ? "bg-muted/30" : ""}`}
          >
            <Avatar className="h-8 w-8">
              {post.author.avatarUrl && <AvatarImage src={post.author.avatarUrl} alt="" />}
              <AvatarFallback>
                {post.author.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{post.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{post.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <ReplyForm threadId={thread.id} />
    </div>
  );
}
