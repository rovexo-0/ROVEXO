"use client";

import Link from "next/link";
import {
  Heart,
  Package,
  Star,
  Tag,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/wallet/utils";
import type { AccountHubSnapshot } from "@/lib/account-center/snapshot";
import type { WalletData } from "@/lib/wallet/types";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type AccountStatsStripProps = {
  snapshot: AccountHubSnapshot;
  wallet?: WalletData | null;
};

const PRIMARY_STATS = [
  { key: "listings" as const, label: "Listings", href: "/seller/listings", Icon: Tag },
  { key: "saved" as const, label: "Saved", href: "/saved", Icon: Heart },
  { key: "orders" as const, label: "Orders", href: "/orders", Icon: Package },
  { key: "wallet" as const, label: "Wallet", href: "/wallet", Icon: Wallet, isWallet: true },
] as const;

const SOCIAL_STATS = [
  { key: "followers" as const, label: "Followers", href: "/account/followers", Icon: Users },
  { key: "following" as const, label: "Following", href: "/account/followers?tab=following", Icon: UserPlus },
  { key: "reviewCount" as const, label: "Reviews", href: "/account/reviews", Icon: Star },
  { key: "rating" as const, label: "Rating", href: "/account/reviews", Icon: UserCheck, isRating: true },
] as const;

function formatStatValue(
  key: keyof AccountHubSnapshot | "wallet",
  snapshot: AccountHubSnapshot,
  wallet?: WalletData | null,
  isRating?: boolean,
): string {
  if (key === "wallet") {
    return wallet != null ? formatCurrency(wallet.availableBalance) : "—";
  }
  if (isRating) {
    return snapshot.rating > 0 ? snapshot.rating.toFixed(1) : "—";
  }
  return String(snapshot[key]);
}

function StatGrid({
  items,
  snapshot,
  wallet,
  className,
}: {
  items: typeof PRIMARY_STATS | typeof SOCIAL_STATS;
  snapshot: AccountHubSnapshot;
  wallet?: WalletData | null;
  className?: string;
}) {
  return (
    <section className={cn("ac-canonical__stats", className)} aria-label="Account statistics">
      {items.map((stat, index) => {
        const Icon = stat.Icon;
        const isWallet = "isWallet" in stat && stat.isWallet;
        const isRating = "isRating" in stat && stat.isRating;
        const value = formatStatValue(stat.key, snapshot, wallet, isRating);

        return (
          <Link
            key={stat.key}
            href={stat.href}
            className={cn(
              "ac-canonical__stat",
              isWallet && "ac-canonical__stat--wallet",
              index < items.length - 1 && "ac-canonical__stat--divider",
              focusRing,
            )}
            aria-label={`${value} ${stat.label}`}
          >
            <Icon className="ac-canonical__stat-icon" strokeWidth={1.75} aria-hidden />
            <span className="ac-canonical__stat-value">{value}</span>
            <span className="ac-canonical__stat-label">{stat.label}</span>
          </Link>
        );
      })}
    </section>
  );
}

export function AccountStatsStrip({ snapshot, wallet = null }: AccountStatsStripProps) {
  return (
    <div className="ac-canonical__stats-wrap">
      <StatGrid items={PRIMARY_STATS} snapshot={snapshot} wallet={wallet} />
      <StatGrid items={SOCIAL_STATS} snapshot={snapshot} wallet={wallet} className="ac-canonical__stats--secondary" />
    </div>
  );
}
