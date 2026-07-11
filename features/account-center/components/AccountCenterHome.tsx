"use client";

import { AccountCanonicalProfile } from "@/features/account-center/components/AccountCanonicalProfile";
import { AccountMenuSections } from "@/features/account-center/components/AccountMenuSections";
import { AccountStatsStrip } from "@/features/account-center/components/AccountStatsStrip";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { UserProfile } from "@/lib/profile/types";

import { AccountWalletCard } from "@/features/account-center/components/AccountWalletCard";
import type { WalletData } from "@/lib/wallet/types";

type AccountCenterHomeProps = {
  profile: UserProfile;
  snapshot: AccountHubSnapshot;
  wallet?: WalletData | null;
};

export function AccountCenterHome({ profile, snapshot, wallet = null }: AccountCenterHomeProps) {
  return (
    <div className="ac-canonical" data-ac-hub-version="v1.0-production">
      <AccountCanonicalProfile profile={profile} snapshot={snapshot} />
      <AccountStatsStrip snapshot={snapshot} wallet={wallet} />
      {wallet ? <AccountWalletCard wallet={wallet} /> : null}
      <AccountMenuSections profile={profile} />
    </div>
  );
}
