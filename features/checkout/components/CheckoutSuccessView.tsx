import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import type { CheckoutFormController } from "@/features/checkout/hooks/use-checkout-form";

type CheckoutSuccessViewProps = {
  form: CheckoutFormController;
};

export function CheckoutSuccessView({ form }: CheckoutSuccessViewProps) {
  const order = form.order;

  return (
    <section
      className="flex w-full flex-col items-center justify-center px-ds-2 py-ds-8 text-center"
      aria-labelledby="checkout-success-heading"
    >
      <PublishedCheckmark />

      <h2 id="checkout-success-heading" className="mt-ds-6 text-xl font-semibold text-text-primary">
        Order Confirmed
      </h2>

      {order && (
        <p className="mt-ds-2 text-sm text-text-secondary">Order #{order.orderNumber}</p>
      )}

      <div className="mt-ds-8 flex w-full max-w-sm flex-col gap-ds-3">
        {order && (
          <Link href={`/orders/${order.id}`} className="block w-full">
            <Button variant="primary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
              View Order
            </Button>
          </Link>
        )}

        <Link href="/" className="block w-full">
          <Button variant="secondary" fullWidth size="lg" className="min-h-ds-7 rounded-ds-lg text-base">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </section>
  );
}
