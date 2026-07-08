"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AvatarUploader } from "@/features/account/components/AvatarUploader";
import { EmailChangeForm } from "@/features/account/components/EmailChangeForm";
import { PasswordChangeForm } from "@/features/account/components/PasswordChangeForm";
import { ProfileMenuRow } from "@/features/profile/components/ProfileMenuRow";
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
    <AccountPageShell
      title="Profile"
      subtitle="Manage your photo, contact details, addresses, security, and preferences."
    >
      <section aria-labelledby="avatar-heading" className="rx-surface-card p-ds-5">
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

      <form onSubmit={onSubmit} className="rx-surface-card flex flex-col gap-ds-4 p-ds-5" noValidate>
        <h2 className="text-base font-semibold text-text-primary">Personal information</h2>

        <Field label="Full name" id="fullName" error={errors.fullName?.message}>
          <input id="fullName" className={inputClassName} autoComplete="name" {...register("fullName")} />
        </Field>
        <p className="-mt-ds-2 text-xs text-text-muted">This is your display name across ROVEXO.</p>

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
          <div className="mt-ds-4 border-t border-border pt-ds-4">
            <p className="text-sm font-medium text-text-primary">Change email</p>
            <div className="mt-ds-2">
              <EmailChangeForm currentEmail={profile.email} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-ds-2">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => {
              setSaveMessage(null);
              reset({
                fullName: profile.fullName,
                username: profile.username,
                phone: profile.phone ?? "",
                bio: profile.bio ?? "",
              });
            }}
          >
            Cancel changes
          </Button>
        </div>
        {saveMessage ? (
          <p className="text-sm text-text-secondary" aria-live="polite">
            {saveMessage}
          </p>
        ) : null}
      </form>

      <section className="rx-surface-card p-ds-5">
        <h2 className="text-base font-semibold text-text-primary">Password</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">Change your password without leaving ROVEXO.</p>
        <div className="mt-ds-4">
          <PasswordChangeForm />
        </div>
      </section>

      <Card padding="none" className="overflow-hidden">
        <nav aria-label="Profile settings">
          <ProfileMenuRow
            title="Addresses"
            subtitle="Shipping and billing"
            href="/account/addresses"
            showChevron={false}
          />
          <div className="border-t border-border">
            <ProfileMenuRow
              title="Language"
              subtitle="Display language"
              href="/account/preferences/language"
              showChevron={false}
            />
          </div>
          <div className="border-t border-border">
            <ProfileMenuRow
              title="Security"
              subtitle="Password, two-factor, sessions"
              href="/account/security"
              showChevron={false}
            />
          </div>
          <div className="border-t border-border">
            <ProfileMenuRow
              title="Privacy"
              subtitle="Visibility and marketing"
              href="/account/privacy"
              showChevron={false}
            />
          </div>
          <div className="border-t border-border">
            <ProfileMenuRow
              title="Blocked users"
              subtitle="Manage blocked accounts"
              href="/account/blocked-users"
              showChevron={false}
            />
          </div>
          <div className="border-t border-border">
            <ProfileMenuRow
              title="Buyer preferences"
              subtitle="Alerts and recommendations"
              href="/account/buyer/preferences"
              showChevron={false}
            />
          </div>
          <div className="border-t border-border">
            <ProfileMenuRow
              title="Notification preferences"
              subtitle="Push and email alerts"
              href="/notifications/settings"
              showChevron={false}
            />
          </div>
        </nav>
      </Card>
    </AccountPageShell>
  );
}
