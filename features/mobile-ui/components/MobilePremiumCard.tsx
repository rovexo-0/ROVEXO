import Link from "next/link";
import { DashboardIcon3D, type DashboardIconType } from "@/components/icons/DashboardIcon3D";
import { MobilePremiumBadge } from "@/features/mobile-ui/components/MobilePremiumPrimitives";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ChevronRightIcon } from "@/features/product-detail/icons";
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
      className={cn("dash-v1-tile", focusRing)}
      aria-label={statusLabel ? `${label}. ${subtitle}. ${statusLabel}` : `${label}. ${subtitle}`}
    >
      <MobilePremiumBadge count={badgeCount} badgeKey={badgeKey} tone={badgeTone} />

      <div className="dash-v1-tile__top">
        <div className="dash-v1-tile__icon">
          <DashboardIcon3D type={iconType} size={32} />
        </div>
        <ChevronRightIcon className="dash-v1-tile__chevron h-4 w-4 shrink-0" aria-hidden />
      </div>

      <div>
        <p className="dash-v1-tile__title">{label}</p>
        <p className="dash-v1-tile__subtitle">{subtitle}</p>
        {statusLabel ? (
          <p className="mt-1 text-[0.6875rem] font-medium text-text-muted">{statusLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function formatMobileBadge(count: number): string {
  if (count > 9) return "9+";
  return String(count);
}
