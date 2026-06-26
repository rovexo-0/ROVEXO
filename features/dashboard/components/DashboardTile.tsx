"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/features/product-detail/icons";
import { DashboardIcon3D, type DashboardIconType } from "@/components/icons/DashboardIcon3D";
import { NotificationBadge } from "@/features/dashboard/components/NotificationBadge";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

export type DashboardTileProps = {
  href: string;
  title: string;
  subtitle: string;
  iconType: DashboardIconType;
  badgeCount?: number;
  badgeTone?: "danger" | "success";
  onClick?: () => void;
  asButton?: boolean;
  statusLabel?: string;
};

export function DashboardTile({
  href,
  title,
  subtitle,
  iconType,
  badgeCount = 0,
  badgeTone = "danger",
  onClick,
  asButton = false,
  statusLabel,
}: DashboardTileProps) {
  const content = (
    <>
      <NotificationBadge count={badgeCount} tone={badgeTone} />
      <div className="dash-v1-tile__top">
        <div className="dash-v1-tile__icon">
          <DashboardIcon3D type={iconType} size={32} />
        </div>
        <ChevronRightIcon className="dash-v1-tile__chevron h-4 w-4 shrink-0" aria-hidden />
      </div>
      <div>
        <p className="dash-v1-tile__title">{title}</p>
        <p className="dash-v1-tile__subtitle">{subtitle}</p>
        {statusLabel ? (
          <p className="mt-1 text-[0.6875rem] font-medium text-text-muted">{statusLabel}</p>
        ) : null}
      </div>
    </>
  );

  const className = cn("dash-v1-tile", focusRing);
  const ariaLabel = statusLabel ? `${title}. ${subtitle}. ${statusLabel}` : `${title}. ${subtitle}`;

  if (asButton && onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}

export function DashboardTileIcon({ children }: { children: ReactNode }) {
  return <div className="dash-v1-tile__icon">{children}</div>;
}
