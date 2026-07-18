"use client";

import { BuyingMenuSections } from "@/features/account-center/components/BuyingMenuSections";
import { SellingMenuSections } from "@/features/account-center/components/SellingMenuSections";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  getModuleMeta,
  type AccountCenterModuleId,
} from "@/lib/account-center/modules";
import { SELLING_HUB_INTRO } from "@/lib/account-center/selling-menu";
import { BUYING_HUB_INTRO } from "@/lib/account-center/buying-menu";

type AccountCenterModulePageProps = {
  moduleId: AccountCenterModuleId;
  description?: string;
  showLogout?: boolean;
};

/**
 * Account hub modules — Master Menu only (tile grids deleted).
 */
export function AccountCenterModulePage({ moduleId }: AccountCenterModulePageProps) {
  const meta = getModuleMeta(moduleId);

  if (moduleId === "buying") {
    return (
      <AccountCanonicalShell
        title={meta.title}
        backHref={meta.backHref}
        backLabel="My Account"
        showHeaderTitle
        intro={BUYING_HUB_INTRO}
      >
        <BuyingMenuSections />
      </AccountCanonicalShell>
    );
  }

  if (moduleId === "selling") {
    return (
      <AccountCanonicalShell
        title={meta.title}
        backHref={meta.backHref}
        backLabel="My Account"
        bottomNavTab="sell"
        showHeaderTitle
        intro={SELLING_HUB_INTRO}
      >
        <SellingMenuSections />
      </AccountCanonicalShell>
    );
  }

  return (
    <AccountCanonicalShell
      title={meta.title}
      backHref={meta.backHref}
      bottomNavTab="account"
      showHeaderTitle
    >
      <p className="cds-section__intro">Open this hub from My Account.</p>
    </AccountCanonicalShell>
  );
}
