"use client";

import Link from "next/link";
import { DashboardIcon3D, type DashboardIconType } from "@/components/icons/DashboardIcon3D";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { MobileBadgeKey, MobileBadgeTone } from "@/lib/mobile-ui/types";

export type MobileHubCardProps = {
  href: string;
  title?: string;
  /** @deprecated use title */
  label?: string;
  iconType: DashboardIconType;
  badge?: number | string | null;
  badgeKey?: MobileBadgeKey;
  badgeCount?: number;
  badgeTone?: MobileBadgeTone;
  className?: string;
  description?: string;
  subtitle?: string;
  onClick?: () => void;
};

/** Absolute Final: Master Menu row density — not a premium tile. */
export function MobileHubCard({
  href,
  title,
  label,
  iconType,
  badge,
  badgeCount,
  className,
  description,
  subtitle,
  onClick,
}: MobileHubCardProps) {
  const heading = title ?? label ?? "";
  const detail = description ?? subtitle;
  const badgeValue = badge ?? badgeCount;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "cds-menu-row flex min-h-[56px] w-full items-center gap-3 border-b border-border px-0 py-0 text-left",
        focusRing,
        className,
      )}
    >
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-primary" aria-hidden>
        <DashboardIcon3D type={iconType} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="cds-menu-row__title block text-[15px] font-medium text-text-primary">
          {heading}
        </span>
        {detail ? <span className="block text-xs text-text-secondary">{detail}</span> : null}
      </span>
      {badgeValue != null && badgeValue !== "" && badgeValue !== 0 ? (
        <span className="text-xs font-semibold text-primary">{badgeValue}</span>
      ) : null}
      <span className="text-text-muted" aria-hidden>
        ›
      </span>
    </Link>
  );
}
