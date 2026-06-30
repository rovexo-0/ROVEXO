"use client";

import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import type { UserProfile } from "@/lib/profile/types";

type SellerDashboardHeaderProps = {
  profile: UserProfile;
};

export function SellerDashboardHeader({ profile }: SellerDashboardHeaderProps) {
  return (
    <DashboardHeader
      title="Seller Dashboard"
      menuLabel="Seller menu"
      profile={profile}
      defaultHub="sell"
    />
  );
}
