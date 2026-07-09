"use client";

import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import type { UserProfile } from "@/lib/profile/types";

type BusinessDashboardHeaderProps = {
  profile: UserProfile;
};

export function BusinessDashboardHeader({ profile }: BusinessDashboardHeaderProps) {
  return (
    <DashboardHeader
      title="Business tools"
      menuLabel="Business tools"
      profile={profile}
      defaultHub="business"
    />
  );
}
