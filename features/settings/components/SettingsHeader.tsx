"use client";

import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import type { UserProfile } from "@/lib/profile/types";

type SettingsHeaderProps = {
  profile: UserProfile;
};

export function SettingsHeader({ profile }: SettingsHeaderProps) {
  return (
    <DashboardHeader
      title="Settings"
      unreadNotifications={profile.unreadNotifications}
      menuLabel="Settings menu"
      profile={profile}
    />
  );
}
