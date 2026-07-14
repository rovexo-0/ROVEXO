"use client";

import { useSearchParams } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { SettingsMenuSections } from "@/features/account-module/components/SettingsMenuSections";

/**
 * ROVEXO Settings — Sprint 1 canonical foundation (mobile-first, 430px).
 */
export function SettingsV1() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  return (
    <AccountCanonicalShell
      title="Settings"
      backHref="/account"
      showHeaderTitle
      className="settings-canonical-shell"
      contentClassName="settings-canonical-shell__content"
    >
      <SettingsMenuSections returnTo={returnTo} />
    </AccountCanonicalShell>
  );
}
