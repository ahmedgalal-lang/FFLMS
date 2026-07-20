import type { Metadata } from "next";
import { requirePrincipal } from "@/server/auth";
import { getMyProfile } from "@/server/services/profile";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export const metadata: Metadata = { title: "Profile & settings" };

export default async function ProfilePage() {
  const principal = await requirePrincipal();
  const profile = await getMyProfile(principal);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Profile &amp; settings</h1>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>

      <ProfileForm
        name={profile.name}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
      />

      <ChangePasswordForm hasPassword={profile.hasPassword} />
    </div>
  );
}
