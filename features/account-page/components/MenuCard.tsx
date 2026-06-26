import Link from "next/link";
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
      className={cn("account-menu-card enterprise-hub-card", focusRing)}
      aria-label={`${title}. ${subtitle}`}
    >
      {badgeCount > 0 ? (
        <NotificationBadge count={badgeCount} className="account-menu-card__badge enterprise-hub-badge" />
      ) : null}
      <div className="account-menu-card__icon dash-v1-tile__icon">
        <DashboardIcon3D type={iconType} size={36} />
      </div>
      <p className="account-menu-card__title dash-v1-tile__title">{title}</p>
      <p className="account-menu-card__subtitle dash-v1-tile__subtitle">{subtitle}</p>
    </Link>
  );
}
