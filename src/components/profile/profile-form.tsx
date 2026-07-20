"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateProfileAction } from "@/app/(learn)/profile/actions";
import { uploadFile } from "@/lib/upload-client";

export function ProfileForm({
  name: initialName,
  bio: initialBio,
  avatarUrl: initialAvatar,
}: {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ ok?: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  async function uploadAvatar(file: File) {
    setMessage(null);
    setUploading(true);
    try {
      const { url } = await uploadFile(file, "avatars");
      setAvatarUrl(url);
      // Persist immediately so the header avatar updates.
      await updateProfileAction({ name, bio, avatarUrl: url });
      router.refresh();
      setMessage({ ok: true, text: "Photo updated." });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setUploading(false);
    }
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateProfileAction({ name, bio, avatarUrl });
      if (res?.error) setMessage({ text: res.error });
      else {
        setMessage({ ok: true, text: "Profile saved." });
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="font-semibold">Basic info</h2>

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload profile photo"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            Upload photo
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or WEBP.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">About you</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short bio…"
          maxLength={1000}
        />
      </div>

      {message && (
        <p className={message.ok ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {message.text}
        </p>
      )}

      <Button onClick={save} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null} Save changes
      </Button>
    </section>
  );
}
