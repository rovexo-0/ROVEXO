"use client";

import { useCallback, useMemo, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { useRouter } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { ShieldLineIcon } from "@/components/icons/RvxLineIcons";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatListingPrice } from "@/lib/listing-card/format";
import {
  calculatePlatformFee,
  FREE_DELIVERY_THRESHOLD,
} from "@/lib/orders/pricing";
import type { CartSummary } from "@/lib/cart/store";
import { groupCartItemsBySeller } from "@/lib/cart/group-by-seller";
import { Trash2 } from "lucide-react";

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
  const [editMode, setEditMode] = useState(false);

  const refresh = useCallback(() => router.refresh(), [router]);

  const selectedItems = useMemo(
    () => cart.items.filter((item) => selectedIds.has(item.id)),
    [cart.items, selectedIds],
  );

  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems],
  );

  const shippingIsFree =
    selectedItems.length > 0 && subtotal >= FREE_DELIVERY_THRESHOLD;

  const shippingLabel =
    selectedItems.length === 0
      ? "—"
      : shippingIsFree
        ? "Free"
        : "Calculated at checkout";

  const platformFee = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + calculatePlatformFee(item.price) * item.quantity,
        0,
      ),
    [selectedItems],
  );

  const total = subtotal + platformFee;
  const sellerGroups = useMemo(() => groupCartItemsBySeller(cart.items), [cart.items]);
  const multiSeller = sellerGroups.length > 1;

  const toggleItem = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const proceedToCheckout = () => {
    if (!checkoutItem) return;
    router.push(`/checkout/${checkoutItem.slug}`);
  };

  return (
    <BetaAppShell className="cart-v1-shell">
      <div className="cart-v1" data-cart-version="v1.0">
        <CanonicalPageHeader
          title={`Your Cart (${cart.itemCount})`}
          backHref="/"
          backLabel="Back"
          rightAction={
            cart.items.length > 0 ? (
              <button
                type="button"
                className="cart-v1__edit min-h-12 px-ds-2 text-sm font-semibold text-primary"
                onClick={() => setEditMode((value) => !value)}
              >
                {editMode ? "Done" : "Edit"}
              </button>
            ) : (
              <span aria-hidden className="w-12" />
            )
          }
        />

        <ScrollContainer as="main" withBottomNav className="cart-v1__main">
          {cart.items.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Add items from listings to checkout securely on ROVEXO."
              actionLabel="Continue shopping"
              actionHref="/"
            />
          ) : (
            <>
              {multiSeller ? (
                <p className="cart-v1__multi-seller-note px-ds-4 pb-ds-2 text-sm text-text-secondary">
                  Items from {sellerGroups.length} sellers — each seller is checked out separately.
                </p>
              ) : null}
              <ul className="cart-v1__items">
                {sellerGroups.map((group) => (
                  <li key={group.sellerId} className="cart-v1__seller-group">
                    {multiSeller ? (
                      <h2 className="cart-v1__seller-heading px-ds-4 pb-ds-2 pt-ds-1 text-sm font-semibold text-text-primary">
                        {group.sellerName}
                        <span className="font-normal text-text-secondary">
                          {" "}
                          · {group.itemCount} item{group.itemCount === 1 ? "" : "s"}
                        </span>
                      </h2>
                    ) : null}
                    <ul className="cart-v1__seller-items">
                      {group.items.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const maxQty = Math.min(item.stock, 99);
                  const lineTotal = item.price * item.quantity;

                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "cart-v1__item",
                        !item.available && "cart-v1__item--disabled",
                        busyId === item.id && "cart-v1__item--busy",
                      )}
                    >
                      <div className="cart-v1__thumb">
                        <SafeImage src={item.imageUrl} alt="" fill sizes="88px" className="object-cover" />
                      </div>

                      <div className="cart-v1__item-body">
                        <div className="cart-v1__item-head">
                          <div className="cart-v1__item-copy">
                            <p className="cart-v1__item-title">{item.title}</p>
                            <p className="cart-v1__item-price">{formatListingPrice(item.price)}</p>
                            {item.sellerName ? (
                              <p className="cart-v1__item-seller">{item.sellerName}</p>
                            ) : null}
                            {item.available ? (
                              <p className="cart-v1__item-stock">In stock</p>
                            ) : (
                              <p className="cart-v1__oos">Out of stock</p>
                            )}
                          </div>

                          <button
                            type="button"
                            className={cn(
                              "cart-v1__select",
                              isSelected && "cart-v1__select--on",
                              focusRing,
                            )}
                            aria-label={`${isSelected ? "Deselect" : "Select"} ${item.title}`}
                            aria-pressed={isSelected}
                            disabled={!item.available}
                            onClick={() => toggleItem(item.id)}
                          >
                            {isSelected ? (
                              <svg viewBox="0 0 20 20" fill="none" aria-hidden>
                                <path
                                  d="M5 10.5 8.5 14 15 7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                          </button>
                        </div>

                        {item.available ? (
                          <div className="cart-v1__qty-row">
                            <button
                              type="button"
                              className="cart-v1__delete"
                              aria-label={`Remove ${item.title}`}
                              onClick={() => void removeItem(item.slug, item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <div className="cart-v1__qty">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={item.quantity <= 1}
                                onClick={() => void updateQuantity(item.slug, item.quantity - 1, item.id)}
                              >
                                −
                              </button>
                              <span aria-live="polite">{item.quantity}</span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={item.quantity >= maxQty}
                                onClick={() => void updateQuantity(item.slug, item.quantity + 1, item.id)}
                              >
                                +
                              </button>
                            </div>

                            <p className="cart-v1__line-total">{formatListingPrice(lineTotal)}</p>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>

              <div className="cart-v1__platform-fee" role="group" aria-label="Platform Fee">
                <span className="cart-v1__platform-fee-icon" aria-hidden>
                  <ShieldLineIcon />
                </span>
                <span className="cart-v1__platform-fee-label">Platform Fee</span>
                <button
                  type="button"
                  className="cart-v1__info"
                  aria-label="About platform fee"
                >
                  i
                </button>
                <span className="cart-v1__platform-fee-amount">{formatListingPrice(platformFee)}</span>
              </div>

              <section className="cart-v1__summary" aria-label="Order summary">
                <div className="cart-v1__summary-row">
                  <span>Items ({selectedCount})</span>
                  <span>{formatListingPrice(subtotal)}</span>
                </div>
                <div className="cart-v1__summary-row">
                  <span>Shipping</span>
                  <span className={shippingLabel === "Calculated at checkout" ? "cart-v1__shipping-pending" : undefined}>
                    {shippingLabel}
                  </span>
                </div>
                <div className="cart-v1__summary-total">
                  <span>Total</span>
                  <span>{formatListingPrice(total)}</span>
                </div>
              </section>
            </>
          )}
        </ScrollContainer>

        {cart.items.length > 0 ? (
          <div className="cart-v1__footer">
            <button
              type="button"
              className="cart-v1__checkout"
              disabled={!checkoutItem}
              onClick={proceedToCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        ) : null}
      </div>
    </BetaAppShell>
  );
}
