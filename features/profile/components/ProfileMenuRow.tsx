import Link from "next/link";
import type { ReactNode } from "react";
import { PremiumIcon } from "@/components/icons/PremiumIcon";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { ChevronRightIcon } from "@/features/product-detail/icons";

type ProfileMenuRowProps = {
  title: string;
  subtitle?: string;
  href?: string;
  icon?: ReactNode;
  badge?: number;
  id?: string;
  iconClassName?: string;
  showChevron?: boolean;
};

export function ProfileMenuRow({
  title,
  subtitle,
  href,
  icon,
  badge,
  id,
  iconClassName,
  showChevron = true,
}: ProfileMenuRowProps) {
  const content = (
    <>
      {icon ? (
        <PremiumIcon size="sm" className={iconClassName} label={title}>
          {icon}
        </PremiumIcon>
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text-primary">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-xs text-text-secondary">{subtitle}</span>
        )}
      </span>

      {(badge != null && badge > 0) || showChevron ? (
        <span className="flex shrink-0 items-center gap-ds-2">
          {badge != null && badge > 0 ? (
            <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-ds-full bg-danger px-ds-1 text-[0.625rem] font-bold text-danger-foreground">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
          {showChevron ? <ChevronRightIcon className="h-4 w-4 text-text-muted" /> : null}
        </span>
      ) : null}
    </>
  );

  const rowClassName = cn(
    "rx-menu-row flex min-h-[56px] w-full items-center px-ds-4 py-ds-2",
    icon ? "gap-ds-3" : "gap-0",
    transitionFast,
    focusRing,
  );

  if (href) {
    return (
      <Link href={href} id={id} className={rowClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div id={id} className={rowClassName}>
      {content}
    </div>
  );
}
