"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardIcon3D, type DashboardIconType } from "@/components/icons/DashboardIcon3D";
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

/** Absolute Final: Master Menu row — not a premium tile. */
export function DashboardTile({
  href,
  title,
  subtitle,
  iconType,
  badgeCount = 0,
  onClick,
  asButton = false,
  statusLabel,
}: DashboardTileProps) {
  const ariaLabel = statusLabel ? `${title}. ${subtitle}. ${statusLabel}` : `${title}. ${subtitle}`;
  const className = cn(
    "cds-menu-row flex min-h-[56px] w-full items-center gap-3 border-b border-border text-left",
    focusRing,
  );

  const content = (
    <>
      <span className="inline-flex h-5 w-5 shrink-0 text-primary" aria-hidden>
        <DashboardIcon3D type={iconType} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-text-primary">{title}</span>
        <span className="block text-xs text-text-secondary">{subtitle}</span>
      </span>
      {badgeCount > 0 ? (
        <span className="text-xs font-semibold text-primary">{badgeCount}</span>
      ) : null}
      <span className="text-text-muted" aria-hidden>
        ›
      </span>
    </>
  );

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
  return <span className="inline-flex h-5 w-5 shrink-0">{children}</span>;
}
