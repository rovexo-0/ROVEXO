import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type HeaderV2IconLinkProps = {
  href: string;
  label: string;
  badge?: number;
  className?: string;
  children: ReactNode;
};

export function HeaderV2IconLink({
  href,
  label,
  badge = 0,
  className,
  children,
}: HeaderV2IconLinkProps) {
  const hasBadge = badge > 0;

  return (
    <Link
      href={href}
      aria-label={hasBadge ? `${label}, ${badge} unread` : label}
      className={cn("rx-h2__action", focusRing, className)}
    >
      <span className="rx-h2__action-icon">{children}</span>
      {hasBadge ? <span className="rx-h2__badge" aria-hidden /> : null}
    </Link>
  );
}
