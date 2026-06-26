import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NotificationBadge } from "@/features/account-page/components/NotificationBadge";
import { resolveMenuIcon } from "@/features/account-page/lib/menu-icons";
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
  const Icon = resolveMenuIcon(href);

  return (
    <Link
      href={href}
      className={cn("account-menu-card", focusRing)}
      aria-label={`${title}. ${subtitle}`}
    >
      {badgeCount > 0 ? (
        <NotificationBadge count={badgeCount} className="account-menu-card__badge" />
      ) : null}
      <div className="account-menu-card__top">
        <div className="account-menu-card__icon">
          <Icon size={22} strokeWidth={2} aria-hidden />
        </div>
        <ChevronRight className="account-menu-card__chevron" size={18} strokeWidth={2} aria-hidden />
      </div>
      <div>
        <p className="account-menu-card__title">{title}</p>
        <p className="account-menu-card__subtitle">{subtitle}</p>
      </div>
    </Link>
  );
}
