import { AccountIcon } from "@/components/account/AccountIcons";
import { cn } from "@/lib/cn";
import { SecureCheckoutHeader } from "@/features/commerce-ui/components/SecureCheckoutHeader";
import { SellerSummaryCard } from "@/features/commerce-ui/components/SellerSummaryCard";
import { OrderSummaryTotals } from "@/features/commerce-ui/components/OrderSummaryTotals";
import { CheckoutPayFooter } from "@/features/commerce-ui/components/CheckoutPayFooter";
import type { CheckoutStepId, CommerceSellerGroup, CommerceTotals } from "@/features/commerce-ui/types";

type CheckoutViewProps = {
  step?: CheckoutStepId;
  sellerGroups: CommerceSellerGroup[];
  totals: CommerceTotals;
  backHref?: string;
  /** When true, renders without the fixed footer (preview mode). */
  preview?: boolean;
  onPay?: () => void;
  className?: string;
};

/**
 * Checkout — Absolute Final.
 * Product → Shipping → Platform Fee → Total → Confirm & Pay.
 * No stepper, no micro actions, no luxury chrome.
 */
export function CheckoutView({
  sellerGroups,
  totals,
  backHref = "/cart",
  preview = false,
  onPay,
  className,
}: CheckoutViewProps) {
  return (
    <div className={cn("ac-canonical flex min-h-full flex-col bg-background", className)}>
      <SecureCheckoutHeader backHref={backHref} />

      <div
        className={cn(
          "flex w-full flex-1 flex-col gap-ds-4 px-ds-4 py-ds-4",
          !preview && "pb-[calc(140px+env(safe-area-inset-bottom))]",
        )}
      >
        <section className="flex flex-col gap-ds-3" aria-label="Product">
          <div className="flex items-center gap-ds-2">
            <span className="ac-canonical__menu-icon text-text-secondary" aria-hidden>
              <AccountIcon name="orders" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Product</h2>
          </div>
          {sellerGroups.map((group) => (
            <SellerSummaryCard key={group.sellerId} group={group} showActions={false} />
          ))}
        </section>

        <OrderSummaryTotals totals={totals} title="Payment" accentTotal />
      </div>

      {preview ? (
        <div className="border-t border-border bg-white px-ds-4 py-ds-4">
          <CheckoutPayFooter total={totals.total} onPay={onPay} inline />
        </div>
      ) : (
        <CheckoutPayFooter total={totals.total} onPay={onPay} />
      )}
    </div>
  );
}
