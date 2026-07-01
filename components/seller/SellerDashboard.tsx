"use client";

import dynamic from "next/dynamic";
import "@/styles/rovexo-seller-dashboard.css";
import { SellerHeroCard } from "@/components/seller/SellerHeroCard";
import { SellerQuickActions } from "@/components/seller/SellerQuickActions";
import { SellerStatsGrid } from "@/components/seller/SellerStatsGrid";
import { SellerPerformanceCard } from "@/components/seller/SellerPerformanceCard";
import { SellerOrdersCard } from "@/components/seller/SellerOrdersCard";
import { SellerFooterActions } from "@/components/seller/SellerFooterActions";
import { SellerDashboardProvider } from "@/hooks/seller";
import type { SellerDashboardData } from "@/types/seller";

const SellerListingsCard = dynamic(
  () => import("@/components/seller/SellerListingsCard").then((mod) => mod.SellerListingsCard),
  { loading: () => <div className="seller-skeleton h-44 w-full" aria-hidden /> },
);
const SellerDraftsCard = dynamic(
  () => import("@/components/seller/SellerDraftsCard").then((mod) => mod.SellerDraftsCard),
  { loading: () => <div className="seller-skeleton h-40 w-full" aria-hidden /> },
);
const SellerMessagesCard = dynamic(
  () => import("@/components/seller/SellerMessagesCard").then((mod) => mod.SellerMessagesCard),
  { loading: () => <div className="seller-skeleton h-44 w-full" aria-hidden /> },
);
const SellerReviewsCard = dynamic(
  () => import("@/components/seller/SellerReviewsCard").then((mod) => mod.SellerReviewsCard),
  { loading: () => <div className="seller-skeleton h-36 w-full" aria-hidden /> },
);
const SellerPayoutCard = dynamic(
  () => import("@/components/seller/SellerPayoutCard").then((mod) => mod.SellerPayoutCard),
  { loading: () => <div className="seller-skeleton h-36 w-full" aria-hidden /> },
);
const SellerBalanceCard = dynamic(
  () => import("@/components/seller/SellerBalanceCard").then((mod) => mod.SellerBalanceCard),
  { loading: () => <div className="seller-skeleton h-44 w-full" aria-hidden /> },
);
const SellerShippingCard = dynamic(
  () => import("@/components/seller/SellerShippingCard").then((mod) => mod.SellerShippingCard),
  { loading: () => <div className="seller-skeleton h-40 w-full" aria-hidden /> },
);
const SellerAnalyticsCard = dynamic(
  () => import("@/components/seller/SellerAnalyticsCard").then((mod) => mod.SellerAnalyticsCard),
  { loading: () => <div className="seller-skeleton h-52 w-full" aria-hidden /> },
);
const SellerPromotionCard = dynamic(
  () => import("@/components/seller/SellerPromotionCard").then((mod) => mod.SellerPromotionCard),
  { loading: () => <div className="seller-skeleton h-40 w-full" aria-hidden /> },
);
const SellerStoreCard = dynamic(
  () => import("@/components/seller/SellerStoreCard").then((mod) => mod.SellerStoreCard),
  { loading: () => <div className="seller-skeleton h-40 w-full" aria-hidden /> },
);
const SellerVerificationCard = dynamic(
  () => import("@/components/seller/SellerVerificationCard").then((mod) => mod.SellerVerificationCard),
  { loading: () => <div className="seller-skeleton h-36 w-full" aria-hidden /> },
);
const SellerSubscriptionCard = dynamic(
  () => import("@/components/seller/SellerSubscriptionCard").then((mod) => mod.SellerSubscriptionCard),
  { loading: () => <div className="seller-skeleton h-36 w-full" aria-hidden /> },
);
const SellerNotificationCard = dynamic(
  () => import("@/components/seller/SellerNotificationCard").then((mod) => mod.SellerNotificationCard),
  { loading: () => <div className="seller-skeleton h-44 w-full" aria-hidden /> },
);
const SellerRecentActivity = dynamic(
  () => import("@/components/seller/SellerRecentActivity").then((mod) => mod.SellerRecentActivity),
  { loading: () => <div className="seller-skeleton h-44 w-full" aria-hidden /> },
);
const SellerSupportCard = dynamic(
  () => import("@/components/seller/SellerSupportCard").then((mod) => mod.SellerSupportCard),
  { loading: () => <div className="seller-skeleton h-36 w-full" aria-hidden /> },
);
const SellerSettingsShortcut = dynamic(
  () => import("@/components/seller/SellerSettingsShortcut").then((mod) => mod.SellerSettingsShortcut),
  { loading: () => <div className="seller-skeleton h-40 w-full" aria-hidden /> },
);

export type SellerDashboardProps = {
  data: SellerDashboardData;
};

export function SellerDashboard({ data }: SellerDashboardProps) {
  return (
    <SellerDashboardProvider data={data}>
      <div className="seller-page">
        <SellerHeroCard />
        <SellerQuickActions />
        <SellerStatsGrid />
        <SellerPerformanceCard />
        <SellerOrdersCard />
        <SellerListingsCard />
        <SellerDraftsCard />
        <SellerMessagesCard />
        <SellerReviewsCard />
        <SellerPayoutCard />
        <SellerBalanceCard />
        <SellerShippingCard />
        <SellerAnalyticsCard />
        <SellerPromotionCard />
        <SellerStoreCard />
        <SellerVerificationCard />
        <SellerSubscriptionCard />
        <SellerNotificationCard />
        <SellerRecentActivity />
        <SellerSupportCard />
        <SellerSettingsShortcut />
        <SellerFooterActions />
      </div>
    </SellerDashboardProvider>
  );
}
