import Link from "next/link";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requirePrincipal } from "@/server/auth";
import { listGroups } from "@/server/services/group";
import { CreateGroupForm } from "@/components/course/create-group-form";

export const metadata: Metadata = { title: "Groups" };

export default async function GroupsPage() {
  const principal = await requirePrincipal();
  const groups = await listGroups(principal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/studio"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← All courses
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Groups</h1>
          <p className="text-sm text-muted-foreground">
            Reusable cohorts — add students once, assign courses to the whole
            group at once.
          </p>
        </div>
        <CreateGroupForm />
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No groups yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/studio/groups/${g.id}`}
              className="rounded-lg border bg-card p-5 transition-colors hover:border-primary"
            >
              <h2 className="font-semibold">{g.name}</h2>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>{g._count.memberships} members</span>
                <span>{g._count.courseAssignments} courses</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
