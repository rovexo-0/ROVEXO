import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { DashboardPerformanceSection } from "@/features/dashboard/components/DashboardPerformanceSection";
import { DashboardQuickActionsGrid } from "@/features/dashboard/components/DashboardQuickActionsGrid";
import { DashboardRecentOrdersSection } from "@/features/dashboard/components/DashboardRecentOrdersSection";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { DashboardSummaryGrid } from "@/features/dashboard/components/DashboardSummaryGrid";
import { BusinessDashboardHeader } from "@/features/business/dashboard/components/BusinessDashboardHeader";
import { BusinessProfileCard } from "@/features/business/dashboard/components/BusinessProfileCard";
import { InventoryOverviewSection } from "@/features/business/dashboard/components/InventoryOverviewSection";
import type { BusinessDashboardData } from "@/lib/business/types";

const QUICK_ACTIONS = [
  { href: "/sell", label: "Add Product", subtitle: "Create a listing" },
  { href: "/business/inventory", label: "Inventory", subtitle: "SKU & stock management" },
  { href: "/business/analytics", label: "Analytics", subtitle: "Insights & reports" },
  { href: "/business/directory", label: "Directory", subtitle: "Verified companies" },
  { href: "/wholesale", label: "Wholesale", subtitle: "MOQ, RFQ & bulk pricing" },
  { href: "/seller/orders", label: "Orders", subtitle: "Fulfillment & shipping" },
  { href: "/messages", label: "Messages", subtitle: "Leads & conversations" },
  { href: "/plans", label: "Plans", subtitle: "Business subscriptions" },
] as const;

type BusinessDashboardPageProps = {
  data: BusinessDashboardData;
};

export function BusinessDashboardPage({ data }: BusinessDashboardPageProps) {
  return (
    <BetaAppShell showBottomNav={false}>
      <HubPageMain withBottomNav={false} className="mx-auto w-full max-w-2xl bg-background px-5 py-5 ">
        <DashboardShell>
          <BusinessDashboardHeader profile={data.profile} />
        <BusinessProfileCard company={data.company} />

        <DashboardSummaryGrid cards={data.todaySummary} />

        <InventoryOverviewSection overview={data.inventoryOverview} />

        <DashboardQuickActionsGrid actions={[...QUICK_ACTIONS]} />

        <DashboardPerformanceSection performance={data.performance} />

        <DashboardRecentOrdersSection orders={data.recentOrders} viewAllHref="/seller/orders" />
        </DashboardShell>
      </HubPageMain>
    </BetaAppShell>
  );
}
