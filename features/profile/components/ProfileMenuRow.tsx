import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";

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

/** Absolute Final: same Master Menu density as CanonicalMenuRow. */
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
        <span className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center", iconClassName)} aria-hidden>
          {icon}
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-text-primary">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-text-secondary">{subtitle}</span>
        ) : null}
      </span>

      {(badge != null && badge > 0) || showChevron ? (
        <span className="flex shrink-0 items-center gap-ds-2">
          {badge != null && badge > 0 ? (
            <span className="text-xs font-semibold text-primary">{badge > 99 ? "99+" : badge}</span>
          ) : null}
          {showChevron ? <ChevronRightLineIcon className="h-4 w-4 text-text-muted" aria-hidden /> : null}
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "cds-menu-row flex min-h-[56px] w-full items-center gap-3 border-b border-border text-left",
    focusRing,
  );

  if (href) {
    return (
      <Link id={id} href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div id={id} className={className}>
      {content}
    </div>
  );
}
