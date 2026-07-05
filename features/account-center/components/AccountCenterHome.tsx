"use client";

import { ProfileCard } from "@/components/account/ProfileCard";
import { MyAccountGrid } from "@/components/account/MyAccountGrid";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type AccountCenterHomeProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

export function AccountCenterHome({ profile, trustData }: AccountCenterHomeProps) {
  return (
    <div className="acx-page">
      <div className="acx-page__container">
        {trustData ? <ProfileCard profile={profile} trustData={trustData} /> : null}
        <MyAccountGrid role={profile.role} />
      </div>
    </div>
  );
}
