"use client";

import type { ReactNode } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import type { BottomNavTab } from "@/components/ui/BottomNavigation";
import { AccountCanonicalHeader } from "@/features/account-canonical/header/AccountCanonicalHeader";
import { cn } from "@/lib/cn";
import { MY_ACCOUNT_V1_DOM, MY_ACCOUNT_V1_MASTER_PAGE } from "@/lib/design-system/my-account-v1";
import { MASTER_FULL_WIDTH_CONTRACT_DOM } from "@/lib/master-engine/master-full-width-contract-v1";
import { CDS_VERSION } from "@/src/components/canonical/tokens";
import { useTranslation } from "@/lib/i18n/use-translation";

export type AccountCanonicalShellProps = {
  /** Retained for page-level semantics; not rendered in the Phase 1 back-only header. */
  title: string;
  backHref?: string;
  backLabel?: string;
  /** Optional back interceptor (e.g. unsaved changes on Edit Listing). */
  onBack?: () => void;
  /**
   * @deprecated Header Standard v1.0 — right slot is always Close.
   * Ignored by AccountCanonicalHeader when titled.
   */
  rightAction?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  bottomNavTab?: BottomNavTab;
  /** When false, hides platform bottom nav (e.g. full-screen Transaction Hub). */
  showBottomNav?: boolean;
  /** My Account hub — no back header */
  hideBack?: boolean;
  /**
   * Centered title in header (Header Standard v1.0).
   * Defaults to true — Orders SSOT: Back · Title · Close.
   */
  showHeaderTitle?: boolean;
  intro?: string;
  /** My Account Master Template v1.0 — set by MyAccountTemplate. */
  dataMyAccountTemplate?: string;
  dataMyAccountMaster?: string;
  dataMyAccountSurface?: string;
};

/**
 * Single canonical shell for My Account, Settings, and every child route.
 * Prefer `MyAccountTemplate` for My Account surfaces (RULE #22–#28).
 */
export function AccountCanonicalShell({
  title,
  backHref = "/account",
  backLabel = "Back",
  onBack,
  rightAction: _rightAction,
  children,
  className,
  contentClassName,
  bottomNavTab = "account",
  showBottomNav = true,
  hideBack = false,
  showHeaderTitle = true,
  intro,
  dataMyAccountTemplate,
  dataMyAccountMaster,
  dataMyAccountSurface,
}: AccountCanonicalShellProps) {
  void _rightAction;
  void showHeaderTitle;
  const { tx } = useTranslation();

  return (
    <BetaAppShell
      bottomNavTab={bottomNavTab}
      showBottomNav={showBottomNav}
      className={cn("account-canonical-shell", className)}
    >
      <div
        className="account-canonical"
        data-account-canonical="v2.0"
        data-full-width-engine="v1.0"
        data-master-full-width={MASTER_FULL_WIDTH_CONTRACT_DOM}
        data-my-account-template={dataMyAccountTemplate ?? MY_ACCOUNT_V1_DOM}
        data-my-account-master={dataMyAccountMaster ?? MY_ACCOUNT_V1_MASTER_PAGE}
        data-my-account-surface={dataMyAccountSurface}
      >
        <div className="cds-layout cds-layout--account-canonical" data-cds-version={CDS_VERSION}>
          {!hideBack ? (
            <div className="cds-layout__header">
              <AccountCanonicalHeader
                backLabel={tx(backLabel)}
                centeredTitle={tx(title)}
                fallbackHref={backHref}
                onBack={onBack}
              />
            </div>
          ) : null}
          <main
            id="main-content"
            className={cn(
              "cds-layout__content",
              showBottomNav && "cds-layout__content--with-bottom-nav",
              "cds-layout__content--account-canonical",
              contentClassName,
            )}
          >
            {intro ? <p className="cds-section__intro">{tx(intro)}</p> : null}
            {children}
          </main>
        </div>
      </div>
    </BetaAppShell>
  );
}
