import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type AccountMenuRowProps = {
  title: string;
  subtitle?: string;
  href?: string;
  icon: ReactNode;
  badge?: number;
  trailing?: ReactNode;
  id?: string;
  destructive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
};

export function AccountMenuRow({
  title,
  subtitle,
  href,
  icon,
  badge,
  trailing,
  id,
  destructive = false,
  onClick,
  disabled = false,
  comingSoon = false,
}: AccountMenuRowProps) {
  const content = (
    <>
      {icon}
      <span className="ac-hub__row-copy">
        <span className={cn("ac-hub__row-title", destructive && "ac-hub__row-title--danger")}>
          <span className="truncate">{title}</span>
          {badge != null && badge > 0 ? (
            <span className="ac-hub__row-badge" aria-label={`${badge} unread`}>
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </span>
        {subtitle ? <span className="ac-hub__row-subtitle">{subtitle}</span> : null}
      </span>
      {trailing ? (
        <span className="ac-hub__row-trailing">{trailing}</span>
      ) : (
        <span className="ac-hub__row-chevron" aria-hidden>
          <ChevronRightLineIcon />
        </span>
      )}
    </>
  );

  const rowClassName = cn(
    "ac-hub__row",
    transitionFast,
    focusRing,
    comingSoon && "ac-hub__row--coming-soon",
  );

  if (href) {
    return (
      <Link href={href} id={id} className={rowClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" id={id} className={rowClassName} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
}
