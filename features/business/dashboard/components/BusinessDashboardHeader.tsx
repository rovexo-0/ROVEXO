"use client";

import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { UserIcon } from "@/features/dashboard/icons";
import {
  ListingsIcon,
  MessagesMenuIcon,
  OrdersMenuIcon,
  WalletMenuIcon,
} from "@/features/profile/icons";
import type { UserProfile } from "@/lib/profile/types";

type BusinessDashboardHeaderProps = {
  profile: UserProfile;
};

export function BusinessDashboardHeader({ profile }: BusinessDashboardHeaderProps) {
  return (
    <DashboardHeader
      title="Business Dashboard"
      unreadNotifications={profile.unreadNotifications}
      menuLabel="Business menu"
      menuItems={[
        {
          title: "Inventory",
          href: "/business/inventory",
          icon: <ListingsIcon className="h-5 w-5" />,
        },
        {
          title: "Orders",
          href: "/seller/orders",
          icon: <OrdersMenuIcon className="h-5 w-5" />,
        },
        {
          title: "Messages",
          href: "/messages",
          icon: <MessagesMenuIcon className="h-5 w-5" />,
          badge: profile.unreadMessages,
        },
        {
          title: "Wallet",
          href: "/seller/wallet",
          icon: <WalletMenuIcon className="h-5 w-5" />,
        },
        {
          title: "Account",
          href: "/account",
          icon: <UserIcon className="h-5 w-5" />,
        },
      ]}
    />
  );
}
