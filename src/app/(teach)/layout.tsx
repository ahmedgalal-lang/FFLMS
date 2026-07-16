import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SiteHeader } from "@/components/site-header";

export default async function TeachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (session.user.role === "STUDENT") redirect("/my-learning");

  return (
    <div className="min-h-screen bg-ground">
      <SiteHeader />
      {children}
    </div>
  );
}
