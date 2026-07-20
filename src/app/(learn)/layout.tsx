import { redirect } from "next/navigation";
import { getPrincipal } from "@/server/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const principal = await getPrincipal();
  if (!principal) redirect("/sign-in");
  return <AppShell>{children}</AppShell>;
}
