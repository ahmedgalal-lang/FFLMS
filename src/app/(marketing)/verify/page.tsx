import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verify a certificate" };

async function goVerify(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim();
  if (code) redirect(`/verify/${encodeURIComponent(code)}`);
  redirect("/verify");
}

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-8 text-center">
      <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
      <div>
        <h1 className="text-2xl font-bold">Verify a certificate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a certificate&apos;s verification code to confirm it&apos;s
          authentic.
        </p>
      </div>
      <form action={goVerify} className="flex gap-2">
        <Input
          name="code"
          placeholder="Verification code"
          aria-label="Verification code"
          required
        />
        <Button type="submit">Verify</Button>
      </form>
    </div>
  );
}
