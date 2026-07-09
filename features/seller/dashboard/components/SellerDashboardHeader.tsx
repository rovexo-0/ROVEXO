"use client";

import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import type { UserProfile } from "@/lib/profile/types";

type SellerDashboardHeaderProps = {
  profile: UserProfile;
};

export function SellerDashboardHeader({ profile }: SellerDashboardHeaderProps) {
  return (
    <DashboardHeader
      title="Selling"
      menuLabel="Selling menu"
      profile={profile}
      defaultHub="sell"
    />
  );
}
