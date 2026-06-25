import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/features/product-detail/icons";
import { MobileNavIcon } from "@/features/mobile-ui/components/MobileNavIcon";
import { MobilePremiumBadge } from "@/features/mobile-ui/components/MobilePremiumPrimitives";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { MobileBadgeKey, MobileBadgeTone } from "@/lib/mobile-ui/types";

export type MobilePremiumCardProps = {
  href: string;
  label: string;
  subtitle: string;
  icon: ReactNode;
  badgeKey?: MobileBadgeKey;
  badgeCount?: number;
  badgeTone?: MobileBadgeTone;
  statusLabel?: string;
};

function formatBadgeCount(count: number): string {
  if (count > 9) return "9+";
  return String(count);
}

export function MobilePremiumCard({
  href,
  label,
  subtitle,
  icon,
  badgeKey,
  badgeCount = 0,
  badgeTone,
  statusLabel,
}: MobilePremiumCardProps) {
  return (
    <Link
      href={href}
      className={cn("mhub-card", focusRing)}
      aria-label={statusLabel ? `${label}. ${subtitle}. ${statusLabel}` : `${label}. ${subtitle}`}
    >
      <MobilePremiumBadge count={badgeCount} badgeKey={badgeKey} tone={badgeTone} />

      <div className="mhub-card__top">
        <MobileNavIcon>{icon}</MobileNavIcon>
        <ChevronRightIcon className="mhub-card__chevron h-4 w-4 shrink-0" aria-hidden />
      </div>

      <div>
        <p className="mhub-card__title">{label}</p>
        <p className="mhub-card__subtitle">{subtitle}</p>
        {statusLabel ? (
          <p className="mt-1 text-[0.6875rem] font-medium text-text-muted">{statusLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function formatMobileBadge(count: number): string {
  return formatBadgeCount(count);
}
