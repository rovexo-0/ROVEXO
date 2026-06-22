import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { DashboardPerformanceSection } from "@/features/dashboard/components/DashboardPerformanceSection";
import { DashboardQuickActionsGrid } from "@/features/dashboard/components/DashboardQuickActionsGrid";
import { DashboardRecentOrdersSection } from "@/features/dashboard/components/DashboardRecentOrdersSection";
import { DashboardSummaryGrid } from "@/features/dashboard/components/DashboardSummaryGrid";
import { BusinessDashboardHeader } from "@/features/business/dashboard/components/BusinessDashboardHeader";
import { BusinessProfileCard } from "@/features/business/dashboard/components/BusinessProfileCard";
import { InventoryOverviewSection } from "@/features/business/dashboard/components/InventoryOverviewSection";
import { HelpPageFooter } from "@/features/help/components/HelpPageFooter";
import type { BusinessDashboardData } from "@/lib/business/types";

const QUICK_ACTIONS = [
  { href: "/business/center", emoji: "🏢", label: "Business Center" },
  { href: "/sell", emoji: "➕", label: "Add Product" },
  { href: "/business/inventory", emoji: "📦", label: "Inventory" },
  { href: "/business/analytics", emoji: "📈", label: "Analytics" },
  { href: "/business/directory", emoji: "📇", label: "Directory" },
  { href: "/wholesale", emoji: "🏭", label: "Wholesale" },
  { href: "/seller/orders", emoji: "📨", label: "Orders" },
  { href: "/messages", emoji: "💬", label: "Messages" },
  { href: "/plans", emoji: "💳", label: "Plans" },
] as const;

type BusinessDashboardPageProps = {
  data: BusinessDashboardData;
};

export function BusinessDashboardPage({ data }: BusinessDashboardPageProps) {
  return (
    <BetaAppShell showBottomNav={false}>
      <BusinessDashboardHeader profile={data.profile} />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-5 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <BusinessProfileCard company={data.company} />

        <DashboardSummaryGrid cards={data.todaySummary} />

        <InventoryOverviewSection overview={data.inventoryOverview} />

        <DashboardQuickActionsGrid actions={[...QUICK_ACTIONS]} />

        <DashboardPerformanceSection performance={data.performance} />

        <DashboardRecentOrdersSection orders={data.recentOrders} viewAllHref="/seller/orders" />
        <HelpPageFooter pathname="/business/dashboard" />
      </main>
    </BetaAppShell>
  );
}
