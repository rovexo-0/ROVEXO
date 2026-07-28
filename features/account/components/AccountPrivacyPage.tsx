"use client";

import {
  CanonicalSection,
  CanonicalMenuRow,
  CanonicalButton,
  CanonicalInfoBlock,
  CanonicalSelector,
  CanonicalSwitch,
} from "@/src/components/canonical";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MyAccountTemplate } from "@/features/account-canonical";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { DocumentLineIcon, LockLineIcon, PeopleLineIcon } from "@/components/icons/RvxLineIcons";
import { coerceUserSafeText } from "@/lib/fail-closed/sanitize";
import { privacyPatchSchema, type PrivacyPatchInput } from "@/lib/account/schemas";

export function AccountPrivacyPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
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
      try {
        const response = await fetch("/api/account/privacy");
        if (!response.ok) throw new Error("unavailable");
        const payload = (await response.json()) as { privacy: PrivacyPatchInput };
        if (!cancelled) reset(payload.privacy);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
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
      setMessage(coerceUserSafeText(payload.error));
    }
  });

  if (loadFailed) {
    return (
      <MyAccountTemplate surface="privacy" title="Privacy" backHref="/account/settings" showHeaderTitle>
        <FailClosedPanel density="section" onRetry={() => window.location.reload()} />
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate surface="privacy" title="Privacy" backHref="/account/settings" showHeaderTitle>
      <div className="settings-subpage-v1 fw-engine__stack" data-settings-privacy="v1.0" data-full-width-surface="privacy">
        <form onSubmit={onSubmit} className="fw-engine__stack" noValidate>
          <CanonicalSection title="Privacy Controls">
            <div className="fw-engine__group">
              <CanonicalSwitch
                id="marketingEmails"
                label="Marketing emails"
                description="Receive offers, tips, and product updates from ROVEXO."
                checked={marketingEmails === true}
                onChange={(checked) => setValue("marketingEmails", checked, { shouldDirty: true })}
              />
              <CanonicalSwitch
                id="showActivityStatus"
                label="Show activity status"
                description="Let others see when you were last active in messages."
                checked={showActivityStatus === true}
                onChange={(checked) =>
                  setValue("showActivityStatus", checked, { shouldDirty: true })
                }
              />
            </div>
          </CanonicalSection>

          <CanonicalSection title="Profile Visibility">
            <div className="fw-engine__group flex flex-col gap-ds-4">
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
              <CanonicalButton type="submit" fullWidth loading={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save privacy settings"}
              </CanonicalButton>
              {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}
            </div>
          </CanonicalSection>
        </form>

        <CanonicalSection title="Data Controls">
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Download My Data"
              icon={<DocumentLineIcon />}
              href="/support?category=data-export"
            />
          </div>
        </CanonicalSection>

        <CanonicalSection title="Cookie Preferences">
          <div className="fw-engine__group">
            <CanonicalMenuRow title="Cookie Preferences" icon={<LockLineIcon />} href="/legal/cookie-policy" />
          </div>
        </CanonicalSection>

        <CanonicalSection title="Blocked Users">
          <div className="fw-engine__group">
            <CanonicalMenuRow
              title="Blocked Users"
              icon={<PeopleLineIcon />}
              href="/account/blocked-users"
            />
          </div>
        </CanonicalSection>
      </div>
    </MyAccountTemplate>
  );
}
