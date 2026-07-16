"use client";

import { BackLineIcon } from "@/components/icons/RvxLineIcons";
import { PageBack } from "@/components/navigation/PageBack";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type CheckoutPageHeaderProps = {
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
};

/** Sprint 1 — back-only checkout header (no title, no trailing action). */
export function CheckoutPageHeader({
  backHref = "/",
  backLabel = "Back",
  onBack,
}: CheckoutPageHeaderProps) {
  return (
    <header className="ckt-v1__header" data-checkout-header="v1.0">
      <div className="ckt-v1__header-bar">
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
      </div>
    </header>
  );
}
