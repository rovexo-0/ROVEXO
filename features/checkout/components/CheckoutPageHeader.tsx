"use client";

import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { PageBack } from "@/components/navigation/PageBack";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type CheckoutPageHeaderProps = {
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  /** Absolute Law v1.0 — title "Checkout". */
  title?: string;
};

/** Absolute Law — back + Checkout title. */
export function CheckoutPageHeader({
  backHref = "/",
  backLabel = "Back",
  onBack,
  title = "Checkout",
}: CheckoutPageHeaderProps) {
  return (
    <header className="ckt-v1__header" data-checkout-header="v1.0">
      <div className="ckt-v1__header-bar ckt-v1__header-bar--titled">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={cn("ckt-v1__header-back", focusRing)}
            aria-label={backLabel}
          >
            <BackLineIcon />
          </button>
        ) : (
          <PageBack
            backHref={backHref}
            backLabel={backLabel}
            className="ckt-v1__header-back-wrap"
          />
        )}
        <h1 className="ckt-v1__header-title">{title}</h1>
        <span className="ckt-v1__header-spacer" aria-hidden />
      </div>
    </header>
  );
}
