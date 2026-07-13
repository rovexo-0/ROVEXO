"use client";

import type { ReactNode } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import type { BottomNavTab } from "@/components/ui/BottomNavigation";
import { AccountCanonicalHeader } from "@/features/account-canonical/header/AccountCanonicalHeader";
import { cn } from "@/lib/cn";
import { CDS_VERSION } from "@/src/components/canonical/tokens";

export type AccountCanonicalShellProps = {
  /** Retained for page-level semantics; not rendered in the Phase 1 back-only header. */
  title: string;
  backHref?: string;
  backLabel?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  bottomNavTab?: BottomNavTab;
  /** My Account hub — no back header */
  hideBack?: boolean;
  /** Centered title in header row (e.g. Orders, Settings). */
  showHeaderTitle?: boolean;
  intro?: string;
};

/**
 * Single canonical shell for My Account, Settings, and every child route.
 */
export function AccountCanonicalShell({
  title,
  backHref = "/account",
  backLabel = "Back",
  rightAction,
  children,
  className,
  contentClassName,
  bottomNavTab = "account",
  hideBack = false,
  showHeaderTitle = false,
  intro,
}: AccountCanonicalShellProps) {
  return (
    <BetaAppShell bottomNavTab={bottomNavTab} className={cn("account-canonical-shell", className)}>
      <div className="account-canonical" data-account-canonical="v2.0">
        <div className="cds-layout cds-layout--account-canonical" data-cds-version={CDS_VERSION}>
          {!hideBack ? (
            <div className="cds-layout__header">
              <AccountCanonicalHeader
                backLabel={backLabel}
                centeredTitle={showHeaderTitle ? title : undefined}
                fallbackHref={backHref}
                rightAction={rightAction}
              />
            </div>
          ) : null}
          <main
            className={cn(
              "cds-layout__content",
              "cds-layout__content--with-bottom-nav",
              "cds-layout__content--account-canonical",
              contentClassName,
            )}
          >
            {intro ? <p className="cds-section__intro">{intro}</p> : null}
            {children}
          </main>
        </div>
      </div>
    </BetaAppShell>
  );
}
