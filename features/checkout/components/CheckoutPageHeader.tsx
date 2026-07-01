"use client";

import { PageBack } from "@/components/navigation/PageBack";
import { cn } from "@/lib/cn";

type CheckoutPageHeaderProps = {
  backHref: string;
  backLabel?: string;
};

export function CheckoutPageHeader({ backHref, backLabel = "Listing" }: CheckoutPageHeaderProps) {
  return (
    <header className="rx-page-header sticky top-0 z-50">
      <div
        className={cn(
          "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
          "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
        )}
      >
        <PageBack
          backHref={backHref}
          backLabel={backLabel}
          preferHistory
          className="justify-self-start"
        />

        <h1 className="truncate text-center text-lg font-semibold text-text-primary">Checkout</h1>

        <span aria-hidden className="w-12" />
      </div>
    </header>
  );
}
