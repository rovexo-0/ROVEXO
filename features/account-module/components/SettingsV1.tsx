"use client";

import { useSearchParams } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { SettingsMenuSections } from "@/features/account-module/components/SettingsMenuSections";

export function SettingsV1() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  return (
    <AccountCanonicalShell
      title="Settings"
      backHref="/account"
      showHeaderTitle
      intro="Manage your account and preferences"
    >
      <SettingsMenuSections returnTo={returnTo} />
    </AccountCanonicalShell>
  );
}
