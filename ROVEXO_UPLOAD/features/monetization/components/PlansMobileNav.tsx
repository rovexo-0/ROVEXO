"use client";

import { MobileHubNavigator } from "@/features/mobile-ui";
import type { UserProfile } from "@/lib/profile/types";

type PlansMobileNavProps = {
  profile?: UserProfile;
};

export function PlansMobileNav({ profile }: PlansMobileNavProps) {
  return (
    <MobileHubNavigator
      profile={profile}
      defaultHub="business"
      startExpanded
      sectionTitle="Explore ROVEXO"
    />
  );
}
