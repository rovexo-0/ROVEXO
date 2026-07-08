"use client";

import Link from "next/link";
import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import type { AccountTileAccent } from "@/components/account/account-nav";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

export type MyAccountCardProps = {
  label: string;
  href: string;
  icon: AccountIconName;
  accent: AccountTileAccent;
};

/**
 * Single My Account destination card. Tile washes use static CSS accent classes
 * (no inline color-mix) and cards avoid transform-based feedback so Android
 * Chrome never retains ghost compositor layers during scroll/repaint.
 */
export function MyAccountCard({ label, href, icon, accent }: MyAccountCardProps) {
  return (
    <Link href={href} aria-label={label} className={cn("acx-card", focusRing)}>
      <span className={cn("acx-card__tile", `acx-card__tile--${accent}`)}>
        <AccountIcon name={icon} className="acx-card__icon" />
      </span>
      <span className="acx-card__label">{label}</span>
    </Link>
  );
}
