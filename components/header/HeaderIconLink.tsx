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
  size?: "default" | "compact";
};

function formatBadgeCount(count: number): string {
  if (count > 99) return "99+";
  if (count > 9) return "9+";
  return String(count);
}

const sizeStyles = {
  default: "h-10 min-h-10 w-10 min-w-10 rounded-ds-md",
  compact: "h-11 min-h-11 w-11 min-w-11 rounded-ds-sm",
} as const;

export function HeaderIconLink({
  href,
  label,
  badge = 0,
  children,
  className,
  size = "default",
}: HeaderIconLinkProps) {
  const hasBadge = badge > 0;
  const badgeLabel = formatBadgeCount(badge);

  return (
    <Link
      href={href}
      aria-label={hasBadge ? `${label}, ${badge} unread` : label}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center text-text-secondary",
        sizeStyles[size],
        transitionNormal,
        "hover:bg-secondary hover:text-text-primary active:scale-[0.94]",
        focusRing,
        className,
      )}
    >
      {children}
      {hasBadge && (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-ds-full bg-danger font-bold leading-none text-danger-foreground ring-2 ring-background",
            size === "compact"
              ? "right-0.5 top-0.5 h-4 min-w-4 px-0.5 text-[0.5625rem]"
              : "right-1 top-1 h-[1.125rem] min-w-[1.125rem] px-1 text-[0.625rem]",
          )}
          aria-hidden
        >
          {badgeLabel}
        </span>
      )}
    </Link>
  );
}
