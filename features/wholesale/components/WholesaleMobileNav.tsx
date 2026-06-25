"use client";

import { MobileHubNavigator } from "@/features/mobile-ui";
import type { UserProfile } from "@/lib/profile/types";

type WholesaleMobileNavProps = {
  profile?: UserProfile;
};

export function WholesaleMobileNav({ profile }: WholesaleMobileNavProps) {
  return (
    <MobileHubNavigator
      profile={profile}
      defaultHub="business"
      startExpanded
      sectionTitle="Explore ROVEXO"
    />
  );
}
