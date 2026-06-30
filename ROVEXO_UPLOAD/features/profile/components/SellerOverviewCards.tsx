import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { DashboardIcon3D } from "@/components/icons/DashboardIcon3D";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import type { SellerStats } from "@/lib/profile/types";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SellerOverviewCardsProps = {
  stats: SellerStats;
  layout?: "default" | "mobile-dashboard";
};

type StatCardProps = {
  icon: ReactNode;
  value: number;
  label: string;
  className?: string;
  mobileDashboard?: boolean;
};

function StatCard({ icon, value, label, className, mobileDashboard }: StatCardProps) {
  if (mobileDashboard) {
    return (
      <div className={cn("rx-dash-tile flex min-h-[96px] flex-col items-center justify-center gap-2", className)}>
        <div className="rx-dash-tile__icon">{icon}</div>
        <span className="text-xl font-bold tabular-nums tracking-tight text-text-primary">
          <AnimatedCounter value={value} />
        </span>
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      </div>
    );
  }

  return (
    <div className={cn("rx-surface-card flex flex-1 flex-col items-center gap-ds-2 p-ds-3 py-ds-4", className)}>
      <PremiumIcon size="sm" glow>
        {icon}
      </PremiumIcon>
      <span className="text-xl font-bold tabular-nums tracking-tight text-text-primary">
        <AnimatedCounter value={value} />
      </span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </div>
  );
}

export function SellerOverviewCards({ stats, layout = "default" }: SellerOverviewCardsProps) {
  const isMobileDashboard = layout === "mobile-dashboard";

  return (
    <section aria-labelledby="seller-overview-heading" className="flex flex-col gap-ds-3">
      <h2
        id="seller-overview-heading"
        className={isMobileDashboard ? "rx-dash-section__title" : "sr-only"}
      >
        Seller overview
      </h2>

      <div
        className={cn(
          isMobileDashboard ? "rx-dash-grid" : "grid grid-cols-3 gap-ds-3",
        )}
      >
        <StatCard
          icon={<DashboardIcon3D type="listings" size={32} />}
          value={stats.listings}
          label="Listings"
          mobileDashboard={isMobileDashboard}
        />
        <StatCard
          icon={<DashboardIcon3D type="analytics" size={32} />}
          value={stats.sales}
          label="Sales"
          mobileDashboard={isMobileDashboard}
        />
        <StatCard
          icon={<DashboardIcon3D type="account" size={32} />}
          value={stats.followers}
          label="Followers"
          mobileDashboard={isMobileDashboard}
        />
      </div>
    </section>
  );
}
