"use client";

import Link from "next/link";
import { Heart, Package, Tag, Wallet } from "lucide-react";
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

function formatStatValue(
  key: keyof AccountHubSnapshot | "wallet",
  snapshot: AccountHubSnapshot,
  wallet?: WalletData | null,
): string {
  if (key === "wallet") {
    return wallet != null ? formatCurrency(wallet.availableBalance) : "—";
  }
  return String(snapshot[key]);
}

export function AccountStatsStrip({ snapshot, wallet = null }: AccountStatsStripProps) {
  return (
    <section className="ac-canonical__stats" aria-label="Account statistics">
      {PRIMARY_STATS.map((stat, index) => {
        const Icon = stat.Icon;
        const isWallet = "isWallet" in stat && stat.isWallet;
        const value = formatStatValue(stat.key, snapshot, wallet);

        return (
          <Link
            key={stat.key}
            href={stat.href}
            className={cn(
              "ac-canonical__stat",
              isWallet && "ac-canonical__stat--wallet",
              index < PRIMARY_STATS.length - 1 && "ac-canonical__stat--divider",
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
