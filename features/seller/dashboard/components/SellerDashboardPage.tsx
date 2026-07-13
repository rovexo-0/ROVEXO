import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { DashboardPerformanceSection } from "@/features/dashboard/components/DashboardPerformanceSection";
import { DashboardQuickActionsGrid } from "@/features/dashboard/components/DashboardQuickActionsGrid";
import { DashboardRecentOrdersSection } from "@/features/dashboard/components/DashboardRecentOrdersSection";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { DashboardSummaryGrid } from "@/features/dashboard/components/DashboardSummaryGrid";
import { SellerDashboardHeader } from "@/features/seller/dashboard/components/SellerDashboardHeader";
import { SellerProfileCard } from "@/features/seller/dashboard/components/SellerProfileCard";
import { SellerPromotionsSection } from "@/features/seller/dashboard/components/SellerPromotionsSection";
import { BringYourItemsDashboardCard } from "@/features/seller/migration/components/BringYourItemsDashboardCard";
import { SellerMigrationHistorySection } from "@/features/seller/migration/components/SellerMigrationHistorySection";
import type { SellerDashboardData } from "@/lib/seller/types";

const QUICK_ACTIONS = [
  { href: "/sell", label: "New Listing", subtitle: "Create a listing" },
  { href: "/seller/listings", label: "My Listings", subtitle: "Manage inventory" },
  { href: "/seller/review-center", label: "Review Center", subtitle: "Moderation reviews" },
  { href: "/seller/orders", label: "Orders", subtitle: "Fulfillment & shipping" },
  { href: "/wallet", label: "Wallet", subtitle: "Balance & payouts" },
  { href: "/seller/analytics", label: "Analytics", subtitle: "Views, sales & trends" },
  { href: "/seller/performance", label: "Seller Performance", subtitle: "Reputation Engine" },
  { href: "/seller/trust", label: "Trust Score", subtitle: "Reputation & safety" },
  { href: "/seller/tax", label: "Tax", subtitle: "VAT & registration" },
  { href: "/messages", label: "Messages", subtitle: "Buyer & seller chats" },
  { href: "/seller/promotions", label: "Promotions", subtitle: "Bump, boost & featured" },
  { href: "/plans", label: "Plans", subtitle: "Premium subscriptions" },
] as const;

type SellerDashboardPageProps = {
  data: SellerDashboardData;
};

export function SellerDashboardPage({ data }: SellerDashboardPageProps) {
  return (
    <BetaAppShell showBottomNav={false}>
      <HubPageMain withBottomNav={false} className="mx-auto w-full max-w-2xl bg-background px-5 py-5 ">
        <DashboardShell>
          <SellerDashboardHeader profile={data.profile} />
        <SellerProfileCard
          profile={data.profile}
          sellerRating={data.sellerRating}
          reviewCount={data.reviewCount}
          activeListings={data.activeListings}
        />

        <BringYourItemsDashboardCard />

        {data.migrationSummary ? (
          <SellerMigrationHistorySection summary={data.migrationSummary} />
        ) : null}

        {data.lowStockCount > 0 && (
          <Card padding="sm" className="border-warning/30 bg-warning/5">
            <p className="text-sm font-medium text-warning">
              {data.lowStockCount} listing{data.lowStockCount === 1 ? "" : "s"} running low on stock.{" "}
              <Link href="/seller/listings?filter=low_stock" className="underline">
                Review inventory
              </Link>
            </p>
          </Card>
        )}

        <DashboardSummaryGrid cards={data.todaySummary} />

        <Card padding="lg" className="">
          <h2 className="text-base font-semibold text-text-primary">30-day performance</h2>
          <div className="mt-ds-4 grid grid-cols-2 gap-ds-3 text-sm">
            <Metric label="Revenue" value={`£${data.monthlyRevenue.toFixed(2)}`} />
            <Metric label="Orders" value={String(data.monthlyOrders)} />
            <Metric label="Conversion" value={`${data.conversionRate}%`} />
            <Metric label="Response time" value={`${data.responseTimeMinutes} min`} />
            <Metric label="Profile views" value={String(data.profileViews)} />
            <Metric label="Followers" value={String(data.followers)} />
            <Metric label="Featured" value={String(data.featuredCount)} />
            <Metric label="Bumps" value={String(data.bumpCount)} />
          </div>
          <div className="mt-ds-4 flex flex-wrap gap-ds-2">
            <Link
              href="/seller/analytics"
              className="rounded-ds-full bg-primary px-ds-4 py-ds-2 text-sm font-medium text-primary-foreground"
            >
              View analytics
            </Link>
            <Link
              href="/seller/tax"
              className="rounded-ds-full border border-border px-ds-4 py-ds-2 text-sm font-medium text-text-primary"
            >
              Tax registration
            </Link>
          </div>
        </Card>

        <SellerPromotionsSection
          promotions={data.activePromotions}
          stats={data.promotionStats}
          history={data.promotionHistory}
        />

        <DashboardQuickActionsGrid actions={[...QUICK_ACTIONS]} />

        <DashboardPerformanceSection performance={data.performance} />

        <DashboardRecentOrdersSection orders={data.recentOrders} viewAllHref="/seller/orders" />
        </DashboardShell>
      </HubPageMain>
    </BetaAppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-secondary">{label}</p>
      <p className="mt-ds-1 font-semibold text-text-primary">{value}</p>
    </div>
  );
}
