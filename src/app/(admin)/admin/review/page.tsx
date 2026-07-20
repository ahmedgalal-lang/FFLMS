import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { listReviewQueue } from "@/server/services/review";
import { AdminNav } from "@/components/admin/admin-nav";
import { ReviewCard } from "@/components/admin/review-card";

export const metadata: Metadata = { title: "Review queue · Admin" };

export default async function AdminReviewPage() {
  const principal = await requirePrincipal();
  const queue = await listReviewQueue(principal);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review queue</h1>
        <p className="text-sm text-muted-foreground">
          {queue.length} course{queue.length === 1 ? "" : "s"} awaiting review
        </p>
      </div>
      <AdminNav />

      {queue.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nothing to review right now.
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((course) => (
            <ReviewCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
