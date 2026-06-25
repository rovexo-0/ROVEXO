"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { AvatarUploader } from "@/features/account/components/AvatarUploader";
import { PasswordChangeForm } from "@/features/account/components/PasswordChangeForm";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/account/schemas";
import type { ProfileDetails } from "@/lib/profile/service";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type ProfileEditPageProps = {
  initialProfile: ProfileDetails;
};

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-ds-1">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

const inputClassName = cn(
  "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
  focusRing,
);

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
    <BetaAppShell showBottomNav={false}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-6 px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
        <div>
          <Link href="/account" className="text-sm font-medium text-primary hover:underline">
            ← Account
          </Link>
          <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">Edit profile</h1>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Update your public profile, contact details, and security settings.
          </p>
        </div>

        <section aria-labelledby="avatar-heading" className="premium-card p-ds-5">
          <h2 id="avatar-heading" className="text-base font-semibold text-text-primary">
            Profile photo
          </h2>
          <div className="mt-ds-4">
            <AvatarUploader
              name={profile.fullName}
              avatarUrl={profile.avatarUrl}
              onUpdated={(avatarUrl) => setProfile((current) => ({ ...current, avatarUrl }))}
            />
          </div>
        </section>

        <form onSubmit={onSubmit} className="premium-card flex flex-col gap-ds-4 p-ds-5" noValidate>
          <h2 className="text-base font-semibold text-text-primary">Personal information</h2>

          <Field label="Full name" id="fullName" error={errors.fullName?.message}>
            <input id="fullName" className={inputClassName} autoComplete="name" {...register("fullName")} />
          </Field>

          <Field label="Username" id="username" error={errors.username?.message}>
            <input
              id="username"
              className={inputClassName}
              autoComplete="username"
              {...register("username")}
            />
          </Field>

          <Field label="Phone" id="phone" error={errors.phone?.message}>
            <input id="phone" className={inputClassName} autoComplete="tel" {...register("phone")} />
          </Field>

          <Field label="Bio" id="bio" error={errors.bio?.message}>
            <textarea
              id="bio"
              rows={4}
              className={cn(inputClassName, "resize-y")}
              {...register("bio")}
            />
          </Field>

          <div className="rounded-ds-lg border border-border bg-surface-muted px-ds-3 py-ds-3">
            <p className="text-sm font-medium text-text-primary">Email</p>
            <p className="mt-ds-1 text-sm text-text-secondary">{profile.email}</p>
            {!profile.emailVerified ? (
              <div className="mt-ds-3 flex flex-wrap items-center gap-ds-2">
                <span className="text-xs font-medium text-warning">Email not verified</span>
                <Button type="button" variant="secondary" size="sm" onClick={() => void resendVerification()}>
                  Resend verification
                </Button>
              </div>
            ) : (
              <p className="mt-ds-1 text-xs text-success">Verified</p>
            )}
            {verifyMessage ? <p className="mt-ds-2 text-xs text-text-secondary">{verifyMessage}</p> : null}
          </div>

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
          {saveMessage ? (
            <p className="text-sm text-text-secondary" aria-live="polite">
              {saveMessage}
            </p>
          ) : null}
        </form>

        <section className="premium-card p-ds-5">
          <h2 className="text-base font-semibold text-text-primary">Account security</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">Change your password without leaving ROVEXO.</p>
          <div className="mt-ds-4">
            <PasswordChangeForm />
          </div>
        </section>
      </main>
    </BetaAppShell>
  );
}
