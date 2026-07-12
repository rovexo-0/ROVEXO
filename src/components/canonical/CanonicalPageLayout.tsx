"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CanonicalPageHeader } from "./CanonicalPageHeader";
import { CDS_VERSION } from "./tokens";

export type CanonicalPageLayoutProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  children: ReactNode;
  /** Reserve space for bottom navigation shell. Default true. */
  reserveBottomNav?: boolean;
  className?: string;
  contentClassName?: string;
  titleId?: string;
  hideBack?: boolean;
};

/**
 * Canonical page shell — header, scrollable content, safe area, bottom nav spacing.
 */
export function CanonicalPageLayout({
  title,
  backHref,
  backLabel,
  onBack,
  rightAction,
  children,
  reserveBottomNav = true,
  className,
  contentClassName,
  titleId,
  hideBack,
}: CanonicalPageLayoutProps) {
  return (
    <div className={cn("cds-layout", className)} data-cds-version={CDS_VERSION}>
      <div className="cds-layout__header">
        <CanonicalPageHeader
          title={title}
          backHref={backHref}
          backLabel={backLabel}
          onBack={onBack}
          rightAction={rightAction}
          titleId={titleId}
          hideBack={hideBack}
        />
      </div>
      <main
        className={cn(
          "cds-layout__content",
          reserveBottomNav && "cds-layout__content--with-bottom-nav",
          contentClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
