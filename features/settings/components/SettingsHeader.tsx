"use client";

import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { UserIcon } from "@/features/dashboard/icons";
import { HeartIcon } from "@/features/product-detail/icons";
import {
  MessagesMenuIcon,
  NotificationsMenuIcon,
  OrdersMenuIcon,
  SettingsIcon,
} from "@/features/profile/icons";
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
      menuItems={[
        {
          title: "Profile",
          href: "/account",
          icon: <UserIcon className="h-5 w-5" />,
        },
        {
          title: "Orders",
          href: "/orders",
          icon: <OrdersMenuIcon className="h-5 w-5" />,
        },
        {
          title: "Saved",
          href: "/saved",
          icon: <HeartIcon className="h-5 w-5 text-danger" filled />,
        },
        {
          title: "Messages",
          href: "/messages",
          icon: <MessagesMenuIcon className="h-5 w-5" />,
          badge: profile.unreadMessages,
        },
        {
          title: "Notifications",
          href: "/notifications",
          icon: <NotificationsMenuIcon className="h-5 w-5" />,
          badge: profile.unreadNotifications,
        },
        {
          title: "Settings",
          href: "/settings",
          icon: <SettingsIcon className="h-5 w-5" />,
        },
      ]}
    />
  );
}
