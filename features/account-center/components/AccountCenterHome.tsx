"use client";

import { AccountPremiumHeader } from "@/features/account-center/components/AccountPremiumHeader";
import { AccountPremiumBanner } from "@/features/account-center/components/AccountPremiumBanner";
import { AccountProfileCard } from "@/features/account-center/components/AccountProfileCard";
import { AccountQuickAccessPremium } from "@/features/account-center/components/AccountQuickAccessPremium";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type AccountCenterHomeProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

export function AccountCenterHome({ profile, trustData }: AccountCenterHomeProps) {
  return (
    <div className="ac2-page">
      <div className="ac2-page__container">
        <AccountPremiumHeader />
        <AccountPremiumBanner />
        {trustData ? <AccountProfileCard profile={profile} trustData={trustData} /> : null}
        <AccountQuickAccessPremium />
      </div>
    </div>
  );
}
