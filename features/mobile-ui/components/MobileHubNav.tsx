"use client";

import { MobileHubNavigator } from "@/features/mobile-ui";
import type { MobilePrimaryHubId } from "@/lib/mobile-ui/types";
import type { UserProfile } from "@/lib/profile/types";

type MobileHubNavProps = {
  profile?: UserProfile;
  defaultHub?: MobilePrimaryHubId;
  startExpanded?: boolean;
  storeSlug?: string;
};

export function MobileHubNav({
  profile,
  defaultHub,
  startExpanded = Boolean(defaultHub),
  storeSlug,
}: MobileHubNavProps) {
  return (
    <MobileHubNavigator
      profile={profile}
      defaultHub={defaultHub}
      startExpanded={startExpanded}
      context={storeSlug ? { storeSlug } : undefined}
    />
  );
}
