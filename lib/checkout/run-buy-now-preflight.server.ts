/**
 * Buy Now server preflight — Root Cause Detection Mode.
 * Never invent order/payment success. Fail closed with RVX codes.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { isPurchasable } from "@/lib/inventory/service";
import { getActiveMarket } from "@/lib/seo/markets";
import { calculatePlatformFee } from "@/lib/orders/pricing";
import { assertMarketplacePurchaseAllowedForProductSlug } from "@/lib/transaction-mode/validate";
import { isStripeConfigured, isStripeRequired } from "@/lib/stripe/server";
import { mustUseVirtualPayments } from "@/lib/full-demo/security";
import {
  runBuyNowGuard,
  formatBuyNowUserError,
  type BuyNowGateResult,
  type BuyNowRvxCode,
} from "@/lib/checkout/buy-now-guard-v1";
import { createHash, randomUUID } from "node:crypto";

export type BuyNowPreflightSuccess = {
  ok: true;
  checkoutPath: string;
  idempotencyKey: string;
  lockToken: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  platformFee: number;
  shipping: number;
  currency: string;
};

export type BuyNowPreflightFailure = {
  ok: false;
  code: BuyNowRvxCode;
  error: string;
  userFacing: string;
  failedStep: NonNullable<BuyNowGateResult["failedStep"]>;
};

export type BuyNowPreflightResult = BuyNowPreflightSuccess | BuyNowPreflightFailure;

function mintIdempotencyKey(buyerId: string, productSlug: string, offerId?: string | null): string {
  const material = `${buyerId}:${productSlug}:${offerId ?? "list"}`;
  const digest = createHash("sha256").update(material).digest("hex").slice(0, 24);
  return `bn_${digest}`;
}

export async function runBuyNowPreflightServer(input: {
  buyerId: string;
  productSlug: string;
  offerId?: string | null;
  /** Client may replay the same key (refresh / back) — never mint a new payment intent. */
  clientIdempotencyKey?: string | null;
}): Promise<BuyNowPreflightResult> {
  const admin = createAdminClient();
  const slug = input.productSlug.trim();

  const { data: product } = await admin
    .from("products")
    .select("id, slug, title, price, stock, status, seller_id, shipping_price")
    .eq("slug", slug)
    .maybeSingle();

  const listingOk = Boolean(product?.id);
  const buyerOk = Boolean(input.buyerId);
  const sellerId = product?.seller_id ?? null;

  let sellerOk = Boolean(sellerId) && sellerId !== input.buyerId;
  if (sellerOk && sellerId) {
    const [{ data: sellerProfile }, { data: sellerSettings }] = await Promise.all([
      admin.from("profiles").select("id, account_status").eq("id", sellerId).maybeSingle(),
      admin.from("user_settings").select("vacation_mode").eq("user_id", sellerId).maybeSingle(),
    ]);
    const sellerExists = Boolean(sellerProfile?.id);
    const sellerActive =
      sellerProfile?.account_status !== "suspended" &&
      sellerProfile?.account_status !== "deleted";
    sellerOk = sellerExists && sellerActive && !Boolean(sellerSettings?.vacation_mode);
  }

  const purchaseCheck = listingOk
    ? await assertMarketplacePurchaseAllowedForProductSlug(slug)
    : { allowed: false as const, error: "Listing unavailable." };
  const listingPurchasable =
    listingOk &&
    product != null &&
    isPurchasable(product.stock, product.status) &&
    purchaseCheck.allowed;

  const priceValue = Number(product?.price ?? NaN);
  const priceOk = Number.isFinite(priceValue) && priceValue > 0;

  const shippingValue = Number(product?.shipping_price ?? 0);
  const shippingOk = Number.isFinite(shippingValue) && shippingValue >= 0;

  const currency = getActiveMarket().currency;
  const currencyOk = Boolean(currency && currency.length === 3);

  const lockOk = Boolean(listingPurchasable && sellerOk && buyerOk);

  // Order / transaction readiness (address collected on checkout — not created yet).
  // Fail closed if prerequisites for a single order path are incomplete.
  const orderReady = listingPurchasable && buyerOk && sellerOk && priceOk && shippingOk && currencyOk && lockOk;
  const transactionReady = orderReady;
  const paymentCapable =
    mustUseVirtualPayments() || isStripeConfigured() || !isStripeRequired();
  const paymentSessionOk = paymentCapable && orderReady;

  const platformFee = priceOk ? calculatePlatformFee(priceValue) : 0;
  const expectedFee = priceOk ? calculatePlatformFee(priceValue) : NaN;
  const expectedTotal = priceOk && shippingOk ? priceValue + shippingValue + expectedFee : NaN;
  const financialAuditOk =
    orderReady &&
    Number.isFinite(platformFee) &&
    Number.isFinite(expectedFee) &&
    Number.isFinite(expectedTotal) &&
    platformFee >= 0 &&
    Math.abs(platformFee - expectedFee) < 0.001 &&
    Math.abs(expectedTotal - (priceValue + shippingValue + platformFee)) < 0.001;

  const idempotencyKey =
    input.clientIdempotencyKey?.startsWith("bn_") && input.clientIdempotencyKey.length >= 10
      ? input.clientIdempotencyKey
      : mintIdempotencyKey(input.buyerId, slug, input.offerId);
  const idempotencyOk = Boolean(idempotencyKey);

  const gate = runBuyNowGuard({
    listing: listingPurchasable,
    buyer: buyerOk,
    seller: sellerOk,
    price: priceOk,
    shipping: shippingOk,
    currency: currencyOk,
    lock: lockOk,
    order: orderReady,
    transaction: transactionReady,
    paymentSession: paymentSessionOk,
    financialAudit: financialAuditOk,
    idempotency: idempotencyOk,
  });

  if (!gate.ok) {
    return {
      ok: false,
      code: gate.code,
      error: gate.message,
      userFacing: gate.userFacing,
      failedStep: gate.failedStep,
    };
  }

  const lockToken = randomUUID();
  const params = new URLSearchParams();
  params.set("bn", idempotencyKey);
  params.set("lt", lockToken);
  if (input.offerId) params.set("offerId", input.offerId);

  return {
    ok: true,
    checkoutPath: `/checkout/${slug}?${params.toString()}`,
    idempotencyKey,
    lockToken,
    listingId: product!.id,
    buyerId: input.buyerId,
    sellerId: sellerId!,
    price: priceValue,
    platformFee,
    shipping: shippingValue,
    currency,
  };
}

export function failBuyNow(code: BuyNowRvxCode): BuyNowPreflightFailure {
  return {
    ok: false,
    code,
    error: formatBuyNowUserError(code).split("\n")[1] ?? code,
    userFacing: formatBuyNowUserError(code),
    failedStep:
      code === "RVX-2001"
        ? "listing"
        : code === "RVX-2002"
          ? "buyer"
          : code === "RVX-2003"
            ? "seller"
            : code === "RVX-2004"
              ? "price"
              : code === "RVX-2005"
                ? "shipping"
                : code === "RVX-2006"
                  ? "currency"
                  : code === "RVX-2007"
                    ? "lock"
                    : code === "RVX-2008"
                      ? "order"
                      : code === "RVX-2009"
                        ? "transaction"
                        : code === "RVX-2010"
                          ? "paymentSession"
                          : code === "RVX-2011"
                            ? "financialAudit"
                            : "idempotency",
  };
}
