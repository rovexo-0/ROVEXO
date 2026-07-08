"use client";

import { AccountHubProfile } from "@/features/account-center/components/AccountHubProfile";
import { AccountMenuList } from "@/features/account-center/components/AccountMenuList";
import type { UserProfile } from "@/lib/profile/types";

type AccountCenterHomeProps = {
  profile: UserProfile;
  walletBalance?: number | null;
};

export function AccountCenterHome({ profile, walletBalance = null }: AccountCenterHomeProps) {
  return (
    <div className="ac-hub" data-ac-hub-version="v1.3">
      <AccountHubProfile profile={profile} />
      <AccountMenuList walletBalance={walletBalance} />
    </div>
  );
}
