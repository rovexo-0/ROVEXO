"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { Button } from "@/components/ui/Button";
import { privacyPatchSchema, type PrivacyPatchInput } from "@/lib/account/schemas";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const selectClassName = cn(
  "w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-3 text-sm text-text-primary",
  focusRing,
);

export function AccountPrivacyPage() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PrivacyPatchInput>({
    resolver: zodResolver(privacyPatchSchema),
    defaultValues: {
      profileVisibility: "public",
      marketingEmails: false,
      showActivityStatus: true,
    },
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/account/privacy");
      const payload = (await response.json()) as { privacy: PrivacyPatchInput };
      if (!cancelled) reset(payload.privacy);
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    setMessage(null);
    const response = await fetch("/api/account/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: string };
    if (response.ok) {
      setMessage("Privacy settings saved.");
    } else {
      setMessage(payload.error ?? "Unable to save privacy settings.");
    }
  });

  return (
    <AccountPageShell
      title="Privacy settings"
      subtitle="Control who can see your profile and how ROVEXO contacts you."
      backHref="/settings"
      backLabel="Settings"
    >
      <form onSubmit={onSubmit} className="premium-card flex flex-col gap-ds-4 p-ds-5" noValidate>
        <div>
          <label htmlFor="profileVisibility" className="text-sm font-medium text-text-primary">
            Profile visibility
          </label>
          <select
            id="profileVisibility"
            className={cn(selectClassName, "mt-ds-1")}
            {...register("profileVisibility")}
          >
            <option value="public">Public — anyone can view</option>
            <option value="members_only">Members only — signed-in users</option>
            <option value="private">Private — only you</option>
          </select>
          {errors.profileVisibility ? (
            <p className="text-xs text-danger">{errors.profileVisibility.message}</p>
          ) : null}
        </div>

        <label className="flex items-start gap-ds-3 text-sm text-text-primary">
          <input type="checkbox" className="mt-1" {...register("marketingEmails")} />
          <span>
            <span className="font-medium">Marketing emails</span>
            <span className="mt-ds-1 block text-text-secondary">
              Receive offers, tips, and product updates from ROVEXO.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-ds-3 text-sm text-text-primary">
          <input type="checkbox" className="mt-1" {...register("showActivityStatus")} />
          <span>
            <span className="font-medium">Show activity status</span>
            <span className="mt-ds-1 block text-text-secondary">
              Let others see when you were last active in messages.
            </span>
          </span>
        </label>

        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save privacy settings"}
        </Button>
        {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
      </form>
    </AccountPageShell>
  );
}
