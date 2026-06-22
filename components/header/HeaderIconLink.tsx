import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing, transitionNormal } from "@/components/ui/tokens";

type HeaderIconLinkProps = {
  href: string;
  label: string;
  badge?: number;
  children: ReactNode;
  className?: string;
};

function formatBadgeCount(count: number): string {
  if (count > 99) return "99+";
  if (count > 9) return "9+";
  return String(count);
}

export function HeaderIconLink({
  href,
  label,
  badge = 0,
  children,
  className,
}: HeaderIconLinkProps) {
  const hasBadge = badge > 0;
  const badgeLabel = formatBadgeCount(badge);

  return (
    <Link
      href={href}
      aria-label={hasBadge ? `${label}, ${badge} unread` : label}
      className={cn(
        "relative inline-flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center rounded-ds-md text-text-secondary",
        transitionNormal,
        "hover:bg-secondary hover:text-text-primary active:scale-[0.98]",
        focusRing,
        className,
      )}
    >
      {children}
      {hasBadge && (
        <span
          className="absolute right-1 top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-ds-full bg-danger px-1 text-[0.625rem] font-bold leading-none text-danger-foreground ring-2 ring-background"
          aria-hidden
        >
          {badgeLabel}
        </span>
      )}
    </Link>
  );
}
