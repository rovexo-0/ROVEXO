"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { AccountPageStack } from "@/features/account-canonical";
import { AvatarUploader } from "@/features/account/components/AvatarUploader";
import { EmailChangeForm } from "@/features/account/components/EmailChangeForm";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalInput,
  CanonicalSection,
  CanonicalTextarea,
} from "@/src/components/canonical";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/account/schemas";
import type { ProfileDetails } from "@/lib/profile/service";

type ProfileEditPageProps = {
  initialProfile: ProfileDetails;
};

export function ProfileEditPage({ initialProfile }: ProfileEditPageProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: profile.fullName,
      username: profile.username,
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
    },
  });

  useEffect(() => {
    reset({
      fullName: profile.fullName,
      username: profile.username,
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
    });
  }, [profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSaveMessage(null);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { profile?: ProfileDetails; error?: string };
    if (!response.ok || !payload.profile) {
      setSaveMessage(payload.error ?? "Unable to save profile.");
      return;
    }
    setProfile(payload.profile);
    setSaveMessage("Profile saved.");
  });

  const resendVerification = async () => {
    setVerifyMessage(null);
    const response = await fetch("/api/profile/verify-email", { method: "POST" });
    const payload = (await response.json()) as { error?: string };
    setVerifyMessage(response.ok ? "Verification email sent." : payload.error ?? "Unable to send email.");
  };

  return (
    <AccountCanonicalShell title="Profile" backHref="/account/settings">
      <AccountPageStack>
        <CanonicalSection title="Profile Photo">
          <CanonicalCard variant="medium" className="p-ds-4">
            <AvatarUploader
              name={profile.fullName}
              avatarUrl={profile.avatarUrl}
              onUpdated={(avatarUrl) => setProfile((current) => ({ ...current, avatarUrl }))}
            />
          </CanonicalCard>
        </CanonicalSection>

        <CanonicalSection title="Personal Information">
          <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
            <form id="profile-form" onSubmit={onSubmit} className="flex flex-col gap-ds-4" noValidate>
              <CanonicalInput
                id="fullName"
                label="Full Name"
                autoComplete="name"
                error={errors.fullName?.message}
                {...register("fullName")}
              />
              <CanonicalInput
                id="username"
                label="Username"
                autoComplete="username"
                error={errors.username?.message}
                {...register("username")}
              />
              <EmailChangeForm currentEmail={profile.email} compact />
              {!profile.emailVerified ? (
                <button
                  type="button"
                  className="account-settings-text-action self-start"
                  onClick={() => void resendVerification()}
                >
                  Resend verification
                </button>
              ) : null}
              {verifyMessage ? (
                <CanonicalInfoBlock variant="description" aria-live="polite">
                  {verifyMessage}
                </CanonicalInfoBlock>
              ) : null}
              <CanonicalInput
                id="phone"
                label="Phone"
                inputType="phone"
                autoComplete="tel"
                error={errors.phone?.message}
                {...register("phone")}
              />
              <CanonicalTextarea
                id="bio"
                label="Bio"
                rows={4}
                error={errors.bio?.message}
                {...register("bio")}
              />
              {saveMessage ? (
                <CanonicalInfoBlock variant="description" aria-live="polite">
                  {saveMessage}
                </CanonicalInfoBlock>
              ) : null}
            </form>
          </CanonicalCard>
        </CanonicalSection>

        <div className="account-settings-sticky-action">
          <CanonicalButton type="submit" form="profile-form" fullWidth loading={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </CanonicalButton>
        </div>
      </AccountPageStack>
    </AccountCanonicalShell>
  );
}
