"use client";

import Link from "next/link";
import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

export type MyAccountCardProps = {
  label: string;
  href: string;
  icon: AccountIconName;
  /** Accent colour; also drives the pastel tile wash. */
  color: string;
};

/**
 * Single My Account destination card. Hover/active states use CSS on `.acx-card`
 * so the grid never receives compositor transforms from framer-motion.
 */
export function MyAccountCard({ label, href, icon, color }: MyAccountCardProps) {
  return (
    <div className="acx-card-motion">
      <Link href={href} aria-label={label} className={cn("acx-card", focusRing)}>
        <span
          className="acx-card__tile"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, #ffffff)`, color }}
        >
          <AccountIcon name={icon} className="acx-card__icon" />
        </span>
        <span className="acx-card__label">{label}</span>
      </Link>
    </div>
  );
}
