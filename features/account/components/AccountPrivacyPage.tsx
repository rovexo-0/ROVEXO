"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea, CanonicalCheckbox } from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { DocumentLineIcon, EyeLineIcon, LockLineIcon, PeopleLineIcon } from "@/components/icons/RvxLineIcons";
import { privacyPatchSchema, type PrivacyPatchInput } from "@/lib/account/schemas";


export function AccountPrivacyPage() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PrivacyPatchInput>({
    resolver: zodResolver(privacyPatchSchema),
    defaultValues: {
      profileVisibility: "public",
      marketingEmails: false,
      showActivityStatus: true,
    },
  });

  const marketingEmails = useWatch({ control, name: "marketingEmails" });
  const showActivityStatus = useWatch({ control, name: "showActivityStatus" });

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
    <AccountCanonicalShell title="Privacy" backHref="/account/settings">
      <CanonicalSection title="Privacy">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Blocked Users"
            icon={<PeopleLineIcon />}
            href="/account/blocked-users"
          />
          <CanonicalMenuRow
            title="Download My Data"
            icon={<DocumentLineIcon />}
            href="/support?category=data-export"
          />
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Visibility">
        <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-ds-4" noValidate>
            <CanonicalSelector
              label="Profile visibility"
              id="profileVisibility"
              kind="generic"
              options={[
                { value: "public", label: "Public — anyone can view" },
                { value: "members_only", label: "Members only — signed-in users" },
                { value: "private", label: "Private — only you" },
              ]}
              error={errors.profileVisibility?.message}
              {...register("profileVisibility")}
            />

            <CanonicalCheckbox
              id="marketingEmails"
              label="Marketing emails"
              description="Receive offers, tips, and product updates from ROVEXO."
              checked={marketingEmails}
              onChange={(event) => setValue("marketingEmails", event.target.checked, { shouldDirty: true })}
            />

            <CanonicalCheckbox
              id="showActivityStatus"
              label="Show activity status"
              description="Let others see when you were last active in messages."
              checked={showActivityStatus}
              onChange={(event) =>
                setValue("showActivityStatus", event.target.checked, { shouldDirty: true })
              }
            />

            <CanonicalButton type="submit" fullWidth loading={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save privacy settings"}
            </CanonicalButton>
            {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
          </form>
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalSection title="Marketing">
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Marketing Preferences"
            description="Email and promotional updates"
            icon={<EyeLineIcon />}
            href="/account/privacy"
          />
          <CanonicalMenuRow
            title="Cookie Preferences"
            icon={<LockLineIcon />}
            href="/legal/cookie-policy"
          />
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
