import type { Metadata } from "next";
import { signInAction } from "../actions";
import { SignInForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <SignInForm action={signInAction} />;
}
