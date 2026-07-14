"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { useTranslation } from "@/lib/i18n/use-translation";

export type CanonicalMenuRowProps = {
  title: string;
  /** Secondary line — matches My Account `subtitle`. */
  description?: string;
  value?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  showChevron?: boolean;
  /** Alias for `showChevron={false}` — matches My Account logout row. */
  hideChevron?: boolean;
  badge?: number;
  trailing?: ReactNode;
  comingSoon?: boolean;
  id?: string;
  className?: string;
};

function MenuRowContent({
  title,
  description,
  value,
  icon,
  badge,
  trailing,
  destructive,
  showChevron,
}: Pick<
  CanonicalMenuRowProps,
  "title" | "description" | "value" | "icon" | "badge" | "trailing" | "destructive" | "showChevron"
>) {
  return (
    <>
      {icon ? (
        <span className="cds-menu-row__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="cds-menu-row__copy">
        <span className={cn("cds-menu-row__title", destructive && "cds-menu-row__title--danger")}>
          <span className="truncate">{title}</span>
          {badge != null && badge > 0 ? (
            <span className="cds-menu-row__badge" aria-label={`${badge} unread`}>
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </span>
        {description ? <span className="cds-menu-row__subtitle">{description}</span> : null}
      </span>
      <span className="cds-menu-row__trailing-group">
        {value ? <span className="cds-menu-row__value">{value}</span> : null}
        {trailing ? <span className="cds-menu-row__trailing">{trailing}</span> : null}
        {showChevron ? (
          <span className="cds-menu-row__chevron" aria-hidden>
            <ChevronRightLineIcon />
          </span>
        ) : null}
      </span>
    </>
  );
}

/**
 * My Account menu row — 1:1 visual parity with `AccountMenuRow` / `ac-canonical__row`.
 */
export function CanonicalMenuRow({
  title,
  description,
  value,
  icon,
  href,
  onClick,
  disabled = false,
  destructive = false,
  showChevron = true,
  hideChevron = false,
  badge,
  trailing,
  comingSoon = false,
  id,
  className,
}: CanonicalMenuRowProps) {
  const { tx } = useTranslation();
  const chevronVisible = showChevron && !hideChevron;

  const content = (
    <MenuRowContent
      title={tx(title)}
      description={description ? tx(description) : undefined}
      value={value ? tx(value) : undefined}
      icon={icon}
      badge={badge}
      trailing={trailing}
      destructive={destructive}
      showChevron={chevronVisible}
    />
  );

  const rowClassName = cn(
    "cds-menu-row",
    transitionFast,
    focusRing,
    comingSoon && "cds-menu-row--coming-soon",
    destructive && hideChevron && "cds-menu-row--destructive-center",
    className,
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
