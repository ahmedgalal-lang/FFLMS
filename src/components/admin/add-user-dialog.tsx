"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createUserAction } from "@/app/(admin)/admin/actions";

export function AddUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a user</DialogTitle>
          <DialogDescription>
            Create an account with an initial password. Share it with the user so
            they can sign in and change it.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError(null);
            startTransition(async () => {
              const res = await createUserAction({
                name: fd.get("name"),
                email: fd.get("email"),
                role: fd.get("role"),
                password: fd.get("password"),
              });
              if (res?.error) setError(res.error);
              else {
                setOpen(false);
                router.refresh();
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="u-name">Name</Label>
            <Input id="u-name" name="name" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" name="email" type="email" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="u-role">Role</Label>
              <select
                id="u-role"
                name="role"
                defaultValue="STUDENT"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-pass">Initial password</Label>
              <Input id="u-pass" name="password" type="text" required minLength={8} />
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null} Create user
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
