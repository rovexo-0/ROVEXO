import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import {
  FollowersIcon,
  ListingsIcon,
  SalesIcon,
} from "@/features/profile/icons";
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
      <div className={cn("account-dash-card flex min-h-[96px] flex-col items-center justify-center gap-ds-2", className)}>
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

  return (
    <div className={cn("premium-card flex flex-1 flex-col items-center gap-ds-2 p-ds-3 py-ds-4", className)}>
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
        className={isMobileDashboard ? "account-dash-section__title" : "sr-only"}
      >
        Seller overview
      </h2>

      <div
        className={cn(
          isMobileDashboard ? "account-dash-seller-stats" : "grid grid-cols-3 gap-ds-3",
        )}
      >
        <StatCard
          icon={<ListingsIcon className="h-5 w-5" />}
          value={stats.listings}
          label="Listings"
          mobileDashboard={isMobileDashboard}
        />
        <StatCard
          icon={<SalesIcon className="h-5 w-5" />}
          value={stats.sales}
          label="Sales"
          mobileDashboard={isMobileDashboard}
        />
        <StatCard
          icon={<FollowersIcon className="h-5 w-5" />}
          value={stats.followers}
          label="Followers"
          mobileDashboard={isMobileDashboard}
        />
      </div>
    </section>
  );
}
