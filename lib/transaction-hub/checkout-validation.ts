import type { CheckoutDraft } from "@/features/checkout/types";
import type { ProductDetail } from "@/lib/products/types";
import type { OrderTotals } from "@/lib/orders/types";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import { getDeliveryPrice } from "@/lib/checkout/delivery";
import type { CheckoutCarrierQuote } from "@/lib/checkout/types";

export type CheckoutValidationResult =
  | { valid: true }
  | { valid: false; field: string; message: string };

export function validateProductPurchasable(product: ProductDetail): CheckoutValidationResult {
  if (product.availability === "out_of_stock" || product.stock <= 0) {
    return { valid: false, field: "product", message: "This item is out of stock." };
  }
  return { valid: true };
}

export function validateCheckoutAddress(draft: CheckoutDraft): CheckoutValidationResult {
  if (!draft.recipientName.trim()) {
    return { valid: false, field: "recipientName", message: "Recipient name is required." };
  }
  if (!draft.addressLine.trim()) {
    return { valid: false, field: "addressLine", message: "Address is required." };
  }
  if (!draft.postcode.trim()) {
    return { valid: false, field: "postcode", message: "Postcode is required." };
  }
  if (!draft.country.trim()) {
    return { valid: false, field: "country", message: "Country is required." };
  }
  return { valid: true };
}

export function validateCheckoutDelivery(input: {
  product: ProductDetail;
  draft: CheckoutDraft;
  selectedQuote: CheckoutCarrierQuote | null;
  quotesAttempted: boolean;
}): CheckoutValidationResult {
  const { product, selectedQuote, quotesAttempted } = input;

  if (product.freeDelivery) {
    return { valid: true };
  }

  const hasListingShippingPrice = product.shippingPrice != null && product.shippingPrice >= 0;
  if (selectedQuote || hasListingShippingPrice) {
    return { valid: true };
  }

  if (!quotesAttempted) {
    return { valid: false, field: "delivery", message: "Loading delivery options…" };
  }

  return { valid: false, field: "delivery", message: "Select a delivery method." };
}

export function validateCheckoutPayment(draft: CheckoutDraft): CheckoutValidationResult {
  if (!draft.paymentMethod) {
    return { valid: false, field: "paymentMethod", message: "Select a payment method." };
  }
  return { valid: true };
}

export function validateCheckoutTotals(
  product: ProductDetail,
  totals: OrderTotals,
  lockedItemPrice?: number | null,
): CheckoutValidationResult {
  if (!Number.isFinite(totals.total) || totals.total <= 0) {
    return { valid: false, field: "total", message: "Order total is invalid." };
  }
  const expectedItemPrice =
    lockedItemPrice != null && lockedItemPrice > 0 ? lockedItemPrice : product.price;
  if (totals.platformFee < 0 || totals.itemPrice !== expectedItemPrice) {
    return {
      valid: false,
      field: "total",
      message:
        lockedItemPrice != null && lockedItemPrice > 0
          ? "Order summary does not match accepted offer price."
          : "Order summary does not match listing price.",
    };
  }
  return { valid: true };
}

export function validateCheckoutReady(input: {
  product: ProductDetail;
  draft: CheckoutDraft;
  selectedQuote: CheckoutCarrierQuote | null;
  quotesAttempted: boolean;
  /** When set, totals must match this accepted-offer price instead of listing price. */
  lockedItemPrice?: number | null;
}): CheckoutValidationResult {
  const itemPrice =
    input.lockedItemPrice != null && input.lockedItemPrice > 0
      ? input.lockedItemPrice
      : input.product.price;

  const checks = [
    validateProductPurchasable(input.product),
    validateCheckoutAddress(input.draft),
    validateCheckoutDelivery(input),
    validateCheckoutPayment(input.draft),
    validateCheckoutTotals(
      input.product,
      calculateOrderTotals(
        itemPrice,
        getDeliveryPrice({
          listingOffersFreeDelivery: input.product.freeDelivery,
          listingShippingPrice: input.product.shippingPrice ?? null,
          selectedQuote: input.selectedQuote,
          liveQuotesAttempted: input.quotesAttempted,
        }),
      ),
      itemPrice,
    ),
  ];

  return checks.find((check) => !check.valid) ?? { valid: true };
}

const DRAFT_STORAGE_PREFIX = "thub-checkout-draft:";

export function persistHubCheckoutDraft(productSlug: string, draft: CheckoutDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${DRAFT_STORAGE_PREFIX}${productSlug}`, JSON.stringify(draft));
  } catch {
    // ignore quota errors
  }
}

export function loadHubCheckoutDraft(productSlug: string): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${DRAFT_STORAGE_PREFIX}${productSlug}`);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
}

export function clearHubCheckoutDraft(productSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${productSlug}`);
  } catch {
    // ignore
  }
}
