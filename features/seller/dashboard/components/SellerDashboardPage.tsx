import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { DashboardPerformanceSection } from "@/features/dashboard/components/DashboardPerformanceSection";
import { DashboardQuickActionsGrid } from "@/features/dashboard/components/DashboardQuickActionsGrid";
import { DashboardRecentOrdersSection } from "@/features/dashboard/components/DashboardRecentOrdersSection";
import { DashboardSummaryGrid } from "@/features/dashboard/components/DashboardSummaryGrid";
import { SellerDashboardHeader } from "@/features/seller/dashboard/components/SellerDashboardHeader";
import { SellerProfileCard } from "@/features/seller/dashboard/components/SellerProfileCard";
import { SellerPromotionsSection } from "@/features/seller/dashboard/components/SellerPromotionsSection";
import type { SellerDashboardData } from "@/lib/seller/types";

const QUICK_ACTIONS = [
  { href: "/sell", emoji: "➕", label: "New Listing" },
  { href: "/seller/listings", emoji: "📦", label: "My Listings" },
  { href: "/seller/orders", emoji: "📨", label: "Orders" },
  { href: "/messages", emoji: "💬", label: "Messages" },
] as const;

type SellerDashboardPageProps = {
  data: SellerDashboardData;
};

export function SellerDashboardPage({ data }: SellerDashboardPageProps) {
  return (
    <BetaAppShell showBottomNav={false}>
      <SellerDashboardHeader profile={data.profile} />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <SellerProfileCard
          profile={data.profile}
          sellerRating={data.sellerRating}
          reviewCount={data.reviewCount}
          activeListings={data.activeListings}
        />

        {data.lowStockCount > 0 && (
          <Card padding="sm" className="border-warning/30 bg-warning/5 shadow-ds-soft">
            <p className="text-sm font-medium text-warning">
              {data.lowStockCount} listing{data.lowStockCount === 1 ? "" : "s"} running low on stock.{" "}
              <Link href="/seller/listings?filter=low_stock" className="underline">
                Review inventory
              </Link>
            </p>
          </Card>
        )}

        <DashboardSummaryGrid cards={data.todaySummary} />

        <SellerPromotionsSection
          promotions={data.activePromotions}
          stats={data.promotionStats}
          history={data.promotionHistory}
        />

        <DashboardQuickActionsGrid actions={[...QUICK_ACTIONS]} />

        <DashboardPerformanceSection performance={data.performance} />

        <DashboardRecentOrdersSection orders={data.recentOrders} viewAllHref="/seller/orders" />
      </main>
    </BetaAppShell>
  );
}
