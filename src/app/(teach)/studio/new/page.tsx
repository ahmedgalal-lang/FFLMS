import type { Metadata } from "next";
import Link from "next/link";
import { listCategories } from "@/server/services/catalog";
import { NewCourseForm } from "./new-course-form";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  const categories = await listCategories();
  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <Link href="/studio" className="text-sm text-ink-3 hover:text-ink">
        ← Studio
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-semibold tracking-tight">
        New course
      </h1>
      <NewCourseForm categories={categories} />
    </main>
  );
}
