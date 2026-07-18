"use client";

import { AccountCanonicalShell } from "@/features/account-canonical";
import { BuyingMenuSections } from "@/features/account-center/components/BuyingMenuSections";

export function BuyingHubPage() {
  return (
    <AccountCanonicalShell
      title="Buying"
      backHref="/account"
      backLabel="My Account"
      showHeaderTitle
    >
      <BuyingMenuSections />
    </AccountCanonicalShell>
  );
}
