"use client";

import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { usePageBack } from "@/hooks/navigation/usePageBack";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { CDS_VERSION } from "@/src/components/canonical/tokens";

export type AccountCanonicalHeaderProps = {
  className?: string;
  backLabel?: string;
  /** Centered page title (Orders and similar hub sub-pages). */
  centeredTitle?: string;
  /** History fallback when back stack is empty. Defaults to /account. */
  fallbackHref?: string;
};

const ACCOUNT_BACK_FALLBACK = "/account";

/**
 * Account module header — back affordance; optional centered title.
 */
export function AccountCanonicalHeader({
  className,
  backLabel = "Back",
  centeredTitle,
  fallbackHref = ACCOUNT_BACK_FALLBACK,
}: AccountCanonicalHeaderProps) {
  const back = usePageBack({
    backHref: fallbackHref,
    backLabel,
    preferHistory: true,
  });

  return (
    <header
      className={cn(
        "account-canonical-header cds-header sticky top-0 z-50",
        centeredTitle && "account-canonical-header--titled",
        className,
      )}
      data-cds-header={CDS_VERSION}
      data-account-canonical-header="v1"
    >
      <div
        className={cn(
          "account-canonical-header__bar",
          centeredTitle && "account-canonical-header__bar--titled",
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
        {centeredTitle ? (
          <>
            <h1 className="account-canonical-header__title">{centeredTitle}</h1>
            <span className="account-canonical-header__spacer" aria-hidden />
          </>
        ) : null}
      </div>
    </header>
  );
}
