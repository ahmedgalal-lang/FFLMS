import type { Metadata } from "next";
import { registerAction } from "../actions";
import { RegisterForm } from "../auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return <RegisterForm action={registerAction} />;
}
