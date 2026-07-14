"use client";

import type { ReactNode } from "react";
import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { Avatar } from "@/components/ui/Avatar";
import { usePageBack } from "@/hooks/navigation/usePageBack";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { CDS_VERSION } from "@/src/components/canonical/tokens";

export type AccountCanonicalHeaderIdentity = {
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
};

export type AccountCanonicalHeaderProps = {
  className?: string;
  backLabel?: string;
  centeredTitle?: string;
  /** My Account hub — back | avatar+name (center) | verified (right). */
  identity?: AccountCanonicalHeaderIdentity;
  fallbackHref?: string;
  rightAction?: ReactNode;
};

const ACCOUNT_BACK_FALLBACK = "/account";

/**
 * Account module header — back affordance; optional identity or centered title.
 */
export function AccountCanonicalHeader({
  className,
  backLabel = "Back",
  centeredTitle,
  identity,
  fallbackHref = ACCOUNT_BACK_FALLBACK,
  rightAction,
}: AccountCanonicalHeaderProps) {
  const back = usePageBack({
    backHref: fallbackHref,
    backLabel,
    preferHistory: true,
  });

  const identityMode = Boolean(identity) && !centeredTitle;

  return (
    <header
      className={cn(
        "account-canonical-header cds-header sticky top-0 z-50",
        centeredTitle && "account-canonical-header--titled",
        identityMode && "account-canonical-header--identity",
        className,
      )}
      data-cds-header={CDS_VERSION}
      data-account-canonical-header="v1"
      data-account-header={identityMode ? "identity-v1" : undefined}
    >
      <div
        className={cn(
          "account-canonical-header__bar",
          centeredTitle && "account-canonical-header__bar--titled",
          identityMode && "account-canonical-header__bar--identity",
        )}
      >
        <button
          type="button"
          onClick={back.goBack}
          className={cn("cds-header__back", focusRing)}
          aria-label={back.label}
        >
          <BackLineIcon />
        </button>

        {identityMode && identity ? (
          <>
            <div className="account-canonical-header__identity" aria-label={identity.name}>
              <Avatar
                src={identity.avatarUrl}
                alt={identity.name}
                name={identity.name}
                size="sm"
                className="account-canonical-header__avatar"
              />
              <p className="account-canonical-header__identity-name">{identity.name}</p>
            </div>
            {identity.verified ? (
              <span className="account-canonical-header__verified">Verified</span>
            ) : (
              <span className="account-canonical-header__spacer" aria-hidden />
            )}
          </>
        ) : null}

        {centeredTitle ? (
          <>
            <h1 className="account-canonical-header__title">{centeredTitle}</h1>
            {rightAction ? (
              <div className="account-canonical-header__action">{rightAction}</div>
            ) : (
              <span className="account-canonical-header__spacer" aria-hidden />
            )}
          </>
        ) : !identityMode && rightAction ? (
          <div className="account-canonical-header__action account-canonical-header__action--trail">
            {rightAction}
          </div>
        ) : null}
      </div>
    </header>
  );
}
