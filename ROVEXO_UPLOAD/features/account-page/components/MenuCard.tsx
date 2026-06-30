import Link from "next/link";
import { ChevronRightIcon } from "@/features/dashboard/icons";
import { DashboardIcon3D, resolveDashboardIconType } from "@/components/icons/DashboardIcon3D";
import { NotificationBadge } from "@/features/account-page/components/NotificationBadge";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type MenuCardProps = {
  href: string;
  title: string;
  subtitle: string;
  badgeCount?: number;
  badgeTone?: "danger" | "success";
};

export function MenuCard({ href, title, subtitle, badgeCount = 0 }: MenuCardProps) {
  const iconType = resolveDashboardIconType(href);

  return (
    <Link
      href={href}
      className={cn("account-menu-card rx-hub-card", focusRing)}
      aria-label={`${title}. ${subtitle}`}
    >
      {badgeCount > 0 ? (
        <NotificationBadge count={badgeCount} className="account-menu-card__badge rx-hub-badge" />
      ) : null}
      <div className="account-menu-card__icon rx-hub-card__icon">
        <DashboardIcon3D type={iconType} size={28} />
      </div>
      <div className="account-menu-card__body rx-hub-card__body">
        <p className="account-menu-card__title rx-hub-card__title">{title}</p>
        <p className="account-menu-card__subtitle rx-hub-card__subtitle">{subtitle}</p>
      </div>
      <ChevronRightIcon className="rx-hub-card__chevron h-4 w-4 shrink-0" aria-hidden />
    </Link>
  );
}
