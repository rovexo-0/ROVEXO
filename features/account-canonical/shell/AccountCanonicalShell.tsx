"use client";

import type { ReactNode } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import type { BottomNavTab } from "@/components/ui/BottomNavigation";
import {
  AccountCanonicalHeader,
  type AccountCanonicalHeaderIdentity,
} from "@/features/account-canonical/header/AccountCanonicalHeader";
import { cn } from "@/lib/cn";
import { CDS_VERSION } from "@/src/components/canonical/tokens";

export type AccountCanonicalShellProps = {
  /** Retained for page-level semantics; not rendered in identity/back-only headers. */
  title: string;
  backHref?: string;
  backLabel?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  bottomNavTab?: BottomNavTab;
  /** My Account hub — no back header (legacy). Prefer `identity` for Sprint 1. */
  hideBack?: boolean;
  /** Centered title in header row (e.g. Orders, Settings). */
  showHeaderTitle?: boolean;
  /** My Account Sprint 1 — back + avatar + name + badges. */
  identity?: AccountCanonicalHeaderIdentity;
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
  identity,
  intro,
}: AccountCanonicalShellProps) {
  const showHeader = !hideBack || Boolean(identity);

  return (
    <BetaAppShell bottomNavTab={bottomNavTab} className={cn("account-canonical-shell", className)}>
      <div className="account-canonical" data-account-canonical="v2.0">
        <div className="cds-layout cds-layout--account-canonical" data-cds-version={CDS_VERSION}>
          {showHeader ? (
            <div className="cds-layout__header">
              <AccountCanonicalHeader
                backLabel={backLabel}
                centeredTitle={showHeaderTitle && !identity ? title : undefined}
                identity={identity}
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
