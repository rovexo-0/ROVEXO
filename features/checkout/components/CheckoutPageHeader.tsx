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

export function CheckoutPageHeader({
  backHref,
  backLabel = "Listing",
  onBack,
}: CheckoutPageHeaderProps) {
  return (
    <header className="rx-page-header sticky top-0 z-50 bg-white">
      <div
        className={cn(
          "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
          "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
        )}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center justify-self-start rounded-full text-text-primary",
              focusRing,
            )}
            aria-label="Go back"
          >
            <BackLineIcon />
          </button>
        ) : backHref ? (
          <PageBack
            backHref={backHref}
            backLabel={backLabel}
            preferHistory
            className="justify-self-start"
          />
        ) : (
          <span aria-hidden className="w-12" />
        )}

        <h1 className="truncate text-center text-lg font-semibold text-text-primary">Checkout</h1>

        <span aria-hidden className="w-12" />
      </div>
    </header>
  );
}
