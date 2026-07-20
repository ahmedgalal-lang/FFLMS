import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { listCategoriesWithCounts } from "@/server/services/category";
import { AdminNav } from "@/components/admin/admin-nav";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories · Admin" };

export default async function AdminCategoriesPage() {
  const principal = await requirePrincipal();
  const categories = await listCategoriesWithCounts(principal);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Taxonomy used to classify and filter courses.
        </p>
      </div>
      <AdminNav />
      <CategoryManager categories={categories} />
    </div>
  );
}
