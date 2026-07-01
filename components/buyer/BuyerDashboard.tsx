"use client";

import dynamic from "next/dynamic";
import "@/styles/rovexo-buyer-dashboard.css";
import { BuyerHeader } from "@/components/buyer/BuyerHeader";
import { BuyerHero } from "@/components/buyer/BuyerHero";
import { BuyerQuickActions } from "@/components/buyer/BuyerQuickActions";
import { BuyerStatistics } from "@/components/buyer/BuyerStatistics";
import { BuyerOrders } from "@/components/buyer/BuyerOrders";
import { BuyerLogout } from "@/components/buyer/BuyerLogout";
import { BuyerDashboardProvider } from "@/hooks/buyer";
import type { BuyerDashboardData } from "@/types/buyer";

const BuyerOrderHistory = dynamic(
  () => import("@/components/buyer/BuyerOrderHistory").then((mod) => mod.BuyerOrderHistory),
  { loading: () => <div className="buyer-skeleton h-60 w-full" aria-hidden /> },
);
const BuyerSavedListings = dynamic(
  () => import("@/components/buyer/BuyerSavedListings").then((mod) => mod.BuyerSavedListings),
  { loading: () => <div className="buyer-skeleton h-52 w-full" aria-hidden /> },
);
const BuyerRecentlyViewed = dynamic(
  () => import("@/components/buyer/BuyerRecentlyViewed").then((mod) => mod.BuyerRecentlyViewed),
  { loading: () => <div className="buyer-skeleton h-52 w-full" aria-hidden /> },
);
const BuyerProtection = dynamic(
  () => import("@/components/buyer/BuyerProtection").then((mod) => mod.BuyerProtection),
  { loading: () => <div className="buyer-skeleton h-44 w-full" aria-hidden /> },
);
const BuyerPayments = dynamic(
  () => import("@/components/buyer/BuyerPayments").then((mod) => mod.BuyerPayments),
  { loading: () => <div className="buyer-skeleton h-40 w-full" aria-hidden /> },
);
const BuyerAddresses = dynamic(
  () => import("@/components/buyer/BuyerAddresses").then((mod) => mod.BuyerAddresses),
  { loading: () => <div className="buyer-skeleton h-40 w-full" aria-hidden /> },
);
const BuyerMessages = dynamic(
  () => import("@/components/buyer/BuyerMessages").then((mod) => mod.BuyerMessages),
  { loading: () => <div className="buyer-skeleton h-44 w-full" aria-hidden /> },
);
const BuyerNotifications = dynamic(
  () => import("@/components/buyer/BuyerNotifications").then((mod) => mod.BuyerNotifications),
  { loading: () => <div className="buyer-skeleton h-44 w-full" aria-hidden /> },
);
const BuyerReviews = dynamic(
  () => import("@/components/buyer/BuyerReviews").then((mod) => mod.BuyerReviews),
  { loading: () => <div className="buyer-skeleton h-36 w-full" aria-hidden /> },
);
const BuyerSecurity = dynamic(
  () => import("@/components/buyer/BuyerSecurity").then((mod) => mod.BuyerSecurity),
  { loading: () => <div className="buyer-skeleton h-40 w-full" aria-hidden /> },
);
const BuyerSettings = dynamic(
  () => import("@/components/buyer/BuyerSettings").then((mod) => mod.BuyerSettings),
  { loading: () => <div className="buyer-skeleton h-40 w-full" aria-hidden /> },
);
const BuyerSupport = dynamic(
  () => import("@/components/buyer/BuyerSupport").then((mod) => mod.BuyerSupport),
  { loading: () => <div className="buyer-skeleton h-36 w-full" aria-hidden /> },
);

export type BuyerDashboardProps = {
  data: BuyerDashboardData;
};

export function BuyerDashboard({ data }: BuyerDashboardProps) {
  return (
    <BuyerDashboardProvider data={data}>
      <div className="buyer-page">
        <BuyerHeader />
        <BuyerHero />
        <BuyerQuickActions />
        <BuyerStatistics />
        <BuyerOrders />
        <BuyerOrderHistory />
        <BuyerSavedListings />
        <BuyerRecentlyViewed />
        <BuyerProtection />
        <BuyerPayments />
        <BuyerAddresses />
        <BuyerMessages />
        <BuyerNotifications />
        <BuyerReviews />
        <BuyerSecurity />
        <BuyerSettings />
        <BuyerSupport />
        <BuyerLogout />
      </div>
    </BuyerDashboardProvider>
  );
}
