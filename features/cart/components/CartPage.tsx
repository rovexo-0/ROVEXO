"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Price } from "@/components/ui/Price";
import { cn } from "@/lib/cn";
import { STANDARD_DELIVERY_COST } from "@/lib/orders/pricing";
import type { CartSummary } from "@/lib/cart/store";

type CartPageProps = {
  cart: CartSummary;
};

async function cartAction(body: Record<string, unknown>) {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

export function CartPage({ cart }: CartPageProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(cart.items.filter((item) => item.available).map((item) => item.id)),
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const selectedItems = useMemo(
    () => cart.items.filter((item) => selectedIds.has(item.id)),
    [cart.items, selectedIds],
  );

  const availableItems = useMemo(() => cart.items.filter((item) => item.available), [cart.items]);

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems],
  );

  const shipping = selectedItems.length > 0 ? STANDARD_DELIVERY_COST : 0;
  const grandTotal = subtotal + shipping;

  const allSelected = availableItems.length > 0 && availableItems.every((item) => selectedIds.has(item.id));

  const toggleItem = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(availableItems.map((item) => item.id)));
  };

  const updateQuantity = async (slug: string, quantity: number, itemId: string) => {
    setBusyId(itemId);
    try {
      await cartAction({ action: "update", productSlug: slug, quantity });
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (slug: string, itemId: string) => {
    setBusyId(itemId);
    try {
      await cartAction({ action: "remove", productSlug: slug });
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(itemId);
        return next;
      });
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  const checkoutItem = selectedItems.find((item) => item.available);

  return (
    <BetaAppShell>
      <BetaPageHeader title="Shopping cart" backHref="/" />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-4 pb-[calc(120px+env(safe-area-inset-bottom))]">
        {cart.items.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Add items from listings to checkout securely on ROVEXO."
            actionLabel="Continue shopping"
            actionHref="/"
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-ds-3">
              <button
                type="button"
                onClick={toggleAll}
                className="text-sm font-semibold text-primary"
              >
                {allSelected ? "Unselect all" : "Select all"}
              </button>
              <p className="text-sm text-text-secondary">{cart.itemCount} items</p>
            </div>

            {cart.items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const maxQty = Math.min(item.stock, 100);
              return (
                <Card
                  key={item.id}
                  padding="md"
                  className={cn(
                    "flex gap-ds-3 transition-opacity",
                    !item.available && "opacity-60",
                    busyId === item.id && "pointer-events-none opacity-70",
                  )}
                >
                  <label className="flex shrink-0 items-start pt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!item.available}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 rounded border-border text-primary"
                      aria-label={`Select ${item.title}`}
                    />
                  </label>
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-ds-2">
                    <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
                    <Price amount={item.price} size="sm" />
                    {!item.available ? (
                      <p className="text-xs font-medium text-danger">Out of stock</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-ds-2">
                        <label className="sr-only" htmlFor={`qty-${item.id}`}>
                          Quantity for {item.title}
                        </label>
                        <select
                          id={`qty-${item.id}`}
                          value={item.quantity}
                          onChange={(event) =>
                            void updateQuantity(item.slug, Number(event.target.value), item.id)
                          }
                          className="rounded-ds-md border border-border bg-surface px-ds-2 py-ds-1 text-sm"
                        >
                          {Array.from({ length: maxQty }, (_, index) => index + 1).map((qty) => (
                            <option key={qty} value={qty}>
                              Qty {qty}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-text-muted">
                          Line total <Price amount={item.price * item.quantity} size="xs" className="inline" />
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="w-fit text-xs font-semibold text-text-muted hover:text-danger"
                      onClick={() => void removeItem(item.slug, item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </Card>
              );
            })}

            <Card padding="lg" className="flex flex-col gap-ds-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Subtotal ({selectedItems.length} selected)</span>
                <Price amount={subtotal} size="sm" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Shipping</span>
                <Price amount={shipping} size="sm" />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-ds-3 text-base font-semibold">
                <span>Grand total</span>
                <Price amount={grandTotal} size="sm" />
              </div>
              <Button
                variant="primary"
                fullWidth
                size="lg"
                disabled={!checkoutItem}
                onClick={() => checkoutItem && router.push(`/checkout/${checkoutItem.slug}`)}
              >
                {checkoutItem ? "Proceed to checkout" : "Select items to checkout"}
              </Button>
            </Card>
          </>
        )}
      </main>
    </BetaAppShell>
  );
}
