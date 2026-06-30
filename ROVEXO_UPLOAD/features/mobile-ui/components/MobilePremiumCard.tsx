import Link from "next/link";
import { DashboardIcon3D, type DashboardIconType } from "@/components/icons/DashboardIcon3D";
import { MobilePremiumBadge } from "@/features/mobile-ui/components/MobilePremiumPrimitives";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { MobileBadgeKey, MobileBadgeTone } from "@/lib/mobile-ui/types";

export type MobilePremiumCardProps = {
  href: string;
  label: string;
  subtitle: string;
  iconType: DashboardIconType;
  badgeKey?: MobileBadgeKey;
  badgeCount?: number;
  badgeTone?: MobileBadgeTone;
  statusLabel?: string;
};

export function MobilePremiumCard({
  href,
  label,
  subtitle,
  iconType,
  badgeKey,
  badgeCount = 0,
  badgeTone,
  statusLabel,
}: MobilePremiumCardProps) {
  return (
    <Link
      href={href}
      className={cn("rx-dash-tile rx-hub-card", focusRing)}
      aria-label={statusLabel ? `${label}. ${subtitle}. ${statusLabel}` : `${label}. ${subtitle}`}
    >
      <MobilePremiumBadge count={badgeCount} badgeKey={badgeKey} tone={badgeTone} />

      <div className="rx-dash-tile__icon rx-hub-card__icon">
        <DashboardIcon3D type={iconType} size={36} />
      </div>
      <p className="rx-dash-tile__title rx-hub-card__title">{label}</p>
      <p className="rx-dash-tile__subtitle rx-hub-card__subtitle">{subtitle}</p>
      {statusLabel ? <p className="rx-dash-tile__status">{statusLabel}</p> : null}
    </Link>
  );
}

export function formatMobileBadge(count: number): string {
  if (count > 9) return "9+";
  return String(count);
}
