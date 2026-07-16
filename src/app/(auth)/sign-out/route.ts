import { signOut } from "@/server/auth";

export async function POST() {
  return signOut({ redirectTo: "/" });
}
