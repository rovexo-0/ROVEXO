"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import type { CartSummary } from "@/lib/cart/store";

type CartPageProps = {
  cart: CartSummary;
};

export function CartPage({ cart }: CartPageProps) {
  const router = useRouter();
  const checkoutItem = cart.items.find((item) => item.available);

  return (
    <BetaAppShell>
      <BetaPageHeader title="Cart" backHref="/" />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        {cart.items.length === 0 ? (
          <Card padding="lg" className="shadow-ds-soft">
            <p className="text-sm text-text-secondary">Your cart is empty.</p>
            <Link href="/" className="mt-ds-4 inline-block text-sm font-semibold text-primary">
              Continue shopping
            </Link>
          </Card>
        ) : (
          cart.items.map((item) => (
            <Card key={item.id} padding="md" className="flex gap-ds-3 shadow-ds-soft">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-ds-1">
                <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
                <Price amount={item.price} size="sm" />
                {!item.available && (
                  <p className="text-xs font-medium text-danger">Out of stock</p>
                )}
                <button
                  type="button"
                  className="mt-ds-1 w-fit text-xs font-semibold text-text-muted"
                  onClick={() =>
                    void fetch("/api/cart", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "remove", productSlug: item.slug }),
                    }).then(() => router.refresh())
                  }
                >
                  Remove
                </button>
              </div>
            </Card>
          ))
        )}

        {cart.items.length > 0 && (
          <Card padding="lg" className="flex flex-col gap-ds-4 shadow-ds-soft">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <Price amount={cart.subtotal} size="sm" />
            </div>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={!checkoutItem}
              onClick={() => checkoutItem && router.push(`/checkout/${checkoutItem.slug}`)}
            >
              {checkoutItem ? "Proceed to Checkout" : "No available items"}
            </Button>
          </Card>
        )}
      </main>
    </BetaAppShell>
  );
}
