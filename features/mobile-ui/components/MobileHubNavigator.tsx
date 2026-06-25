"use client";

import type { ReactNode } from "react";
import { MobilePrimaryHubs } from "@/features/mobile-ui/components/MobilePrimaryHubs";
import { MobileSkeletonGrid } from "@/features/mobile-ui";
import { useMobileHubProfile } from "@/features/mobile-ui/hooks/use-mobile-hub-profile";
import type { MobileBadges, MobileHubContext, MobilePrimaryHubId } from "@/lib/mobile-ui/types";
import type { UserProfile } from "@/lib/profile/types";

type MobileHubNavigatorProps = {
  profile?: UserProfile;
  defaultHub?: MobilePrimaryHubId;
  startExpanded?: boolean;
  context?: MobileHubContext;
  header?: ReactNode;
  footer?: ReactNode;
  sectionTitle?: string;
  badgeSeed?: Partial<MobileBadges> & { isSeller?: boolean };
};

export function MobileHubNavigator({
  profile: profileProp,
  defaultHub,
  startExpanded = false,
  context,
  header,
  footer,
  sectionTitle,
  badgeSeed,
}: MobileHubNavigatorProps) {
  const { profile, loading } = useMobileHubProfile(profileProp);

  if (loading) {
    return <MobileSkeletonGrid count={4} />;
  }

  return (
    <MobilePrimaryHubs
      profile={profileProp ?? profile}
      defaultHub={defaultHub}
      startExpanded={startExpanded}
      context={context}
      header={header}
      footer={footer}
      sectionTitle={sectionTitle}
      badgeSeed={
        badgeSeed ?? {
          isSeller: (profileProp ?? profile).isSeller,
          messages: (profileProp ?? profile).unreadMessages,
          notifications: (profileProp ?? profile).unreadNotifications,
        }
      }
    />
  );
}
