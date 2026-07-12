import type { ReactNode } from "react";
import Link from "next/link";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";

type BetaPageHeaderProps = {
  title: string;
  backHref?: string;
  className?: string;
  rightAction?: ReactNode;
};

/** @deprecated Use CanonicalPageHeader directly. */
export function BetaPageHeader({ title, backHref = "/", className, rightAction }: BetaPageHeaderProps) {
  return (
    <CanonicalPageHeader
      title={title}
      backHref={backHref}
      rightAction={rightAction}
      className={className}
    />
  );
}

export function BetaPageHeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-primary">
      {children}
    </Link>
  );
}
