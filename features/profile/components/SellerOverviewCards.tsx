import { Card } from "@/components/ui/Card";
import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import {
  FollowersIcon,
  ListingsIcon,
  SalesIcon,
} from "@/features/profile/icons";
import type { SellerStats } from "@/lib/profile/types";
import type { ReactNode } from "react";

type SellerOverviewCardsProps = {
  stats: SellerStats;
};

type StatCardProps = {
  icon: ReactNode;
  value: number;
  label: string;
};

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <Card padding="sm" className="flex flex-1 flex-col items-center gap-ds-2 py-ds-4">
      <PremiumIcon size="sm" glow>
        {icon}
      </PremiumIcon>
      <span className="text-xl font-bold tabular-nums tracking-tight text-text-primary">
        <AnimatedCounter value={value} />
      </span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </Card>
  );
}

export function SellerOverviewCards({ stats }: SellerOverviewCardsProps) {
  return (
    <section aria-labelledby="seller-overview-heading" className="flex flex-col gap-ds-3">
      <h2 id="seller-overview-heading" className="sr-only">
        Seller overview
      </h2>

      <div className="grid grid-cols-3 gap-ds-3">
        <StatCard icon={<ListingsIcon className="h-5 w-5" />} value={stats.listings} label="Listings" />
        <StatCard icon={<SalesIcon className="h-5 w-5" />} value={stats.sales} label="Sales" />
        <StatCard icon={<FollowersIcon className="h-5 w-5" />} value={stats.followers} label="Followers" />
      </div>
    </section>
  );
}
