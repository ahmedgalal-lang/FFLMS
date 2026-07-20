import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { listUsers } from "@/server/services/admin";
import { parsePagination } from "@/server/http";
import { adminUsersQuerySchema } from "@/lib/validation";
import { AdminNav } from "@/components/admin/admin-nav";
import { UserRow } from "@/components/admin/user-row";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Users · Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const principal = await requirePrincipal();
  const query = adminUsersQuerySchema.parse({ q: sp.q, role: sp.role, page: sp.page });
  const pagination = parsePagination(
    new URLSearchParams({ page: String(query.page ?? 1), pageSize: "25" }),
  );
  const { items, total } = await listUsers(
    principal,
    { q: query.q, role: query.role },
    pagination,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>
      <AdminNav />

      <form className="flex flex-wrap gap-2" action="/admin/users">
        <Input name="q" defaultValue={query.q ?? ""} placeholder="Search name or email…" className="max-w-xs" aria-label="Search users" />
        <select name="role" defaultValue={query.role ?? ""} aria-label="Filter by role" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="STUDENT">Student</option>
        </select>
        <Button type="submit">Search</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Activity</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === principal.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
