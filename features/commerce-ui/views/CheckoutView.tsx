import { Package } from "lucide-react";
import { cn } from "@/lib/cn";
import { SecureCheckoutHeader } from "@/features/commerce-ui/components/SecureCheckoutHeader";
import { CommerceStepper } from "@/features/commerce-ui/components/CommerceStepper";
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
 * Canonical Checkout UI (UI LOCK).
 *
 * Shows only Products, Shipping, Platform Fee and Total. Never exposes buyer
 * protection, fee percentage, shipping labels or parcel count.
 */
export function CheckoutView({
  step = "payment",
  sellerGroups,
  totals,
  backHref = "/cart",
  preview = false,
  onPay,
  className,
}: CheckoutViewProps) {
  return (
    <div className={cn("flex min-h-full flex-col bg-background", className)}>
      <SecureCheckoutHeader backHref={backHref} />

      <div
        className={cn(
          "mx-auto flex w-full max-w-lg flex-1 flex-col gap-ds-5 px-ds-4 py-ds-5",
          !preview && "pb-[calc(140px+env(safe-area-inset-bottom))]",
        )}
      >
        <CommerceStepper current={step} />

        <section className="flex flex-col gap-ds-4">
          <div className="flex items-center gap-ds-2">
            <Package className="h-5 w-5 text-text-secondary" aria-hidden />
            <h2 className="text-base font-semibold text-text-primary">Order Summary</h2>
          </div>

          {sellerGroups.map((group) => (
            <SellerSummaryCard key={group.sellerId} group={group} showActions />
          ))}
        </section>

        <OrderSummaryTotals totals={totals} accentTotal />
      </div>

      {preview ? (
        <div className="border-t border-border bg-surface px-ds-4 py-ds-4">
          <CheckoutPayFooter total={totals.total} onPay={onPay} inline />
        </div>
      ) : (
        <CheckoutPayFooter total={totals.total} onPay={onPay} />
      )}
    </div>
  );
}
