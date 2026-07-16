import { redirect } from "next/navigation";
import { getPrincipal } from "@/server/auth";

/** Sends each signed-in user to their role's home. */
export default async function DashboardRouter() {
  const principal = await getPrincipal();
  if (!principal) redirect("/sign-in");
  switch (principal.role) {
    case "ADMIN":
      redirect("/admin");
    case "INSTRUCTOR":
      redirect("/studio");
    default:
      redirect("/my-learning");
  }
}
