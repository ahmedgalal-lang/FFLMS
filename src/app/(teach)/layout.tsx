import { redirect } from "next/navigation";
import { getPrincipal } from "@/server/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function TeachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const principal = await getPrincipal();
  if (!principal) redirect("/sign-in");
  if (principal.role !== "INSTRUCTOR" && principal.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return <AppShell>{children}</AppShell>;
}
