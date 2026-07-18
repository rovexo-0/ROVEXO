"use client";

import { AccountCanonicalShell } from "@/features/account-canonical";
import { BuyingMenuSections } from "@/features/account-center/components/BuyingMenuSections";
import { BUYING_HUB_INTRO } from "@/lib/account-center/buying-menu";

export function BuyingHubPage() {
  return (
    <AccountCanonicalShell
      title="Buying"
      backHref="/account"
      backLabel="My Account"
      showHeaderTitle
      intro={BUYING_HUB_INTRO}
    >
      <BuyingMenuSections />
    </AccountCanonicalShell>
  );
}
