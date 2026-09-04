/**
 * Promote payment execution — TIME only (never marketplace rights).
 * Money → ROVEXO profit (non-refundable) → instant activation → timer starts.
 *
 * Payment methods allowed: My Wallet · Default Saved Card
 * Reuses Wallet Engine + Stripe Payment Methods Engine.
 */

import "server-only";

import { ensureStripeCustomer, listPaymentMethods } from "@/lib/payments/repository";
import {
  applyListingPromotion,
  createPendingPromotion,
  validateBumpPurchase,
} from "@/lib/promotions/service";
import {
  applySellerPromotion,
  createPendingSellerPromotion,
  resolveSellerPromotionPricing,
  type SellerPromotionType,
} from "@/lib/promotions/seller-promotions";
import {
  sanitizePromotionCheckoutError,
  toPromotionPaymentSafeError,
  type PromotionPaymentMethodId,
} from "@/lib/promotions/payment-safe";
import { notifyPromotionActivated } from "@/lib/promotions/notifications";
import { getAppBaseUrl, getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canDebitAvailable, roundWalletMoney } from "@/lib/wallet/security";
import {
  FULL_DEMO_VIRTUAL_FUNDS_GBP,
  isFullDemoEmail,
} from "@/lib/full-demo/canonical";
import {
  getPromotionDuration,
  type PromotionType,
} from "@/lib/promotions/config";
import { getMarketplacePricingSettings } from "@/lib/promotions/marketplace-pricing";
import { getStoreShowcasePersistenceStatus } from "@/lib/promote/store-showcase-status";
import { resolveStoreShowcasePurchaseGate } from "@/lib/master-engine/store-showcase";
import { isSellerOnVacation } from "@/lib/settings/vacation";
import { STORE_SHOWCASE_PACKAGE_ID } from "@/lib/promote/constants";
import { isValidStoreShowcasePackage } from "@/lib/promote/store-showcase-engine";
import { resolveBoostPackageTier } from "@/lib/promotions/canonical-tools";

export type PayPromotionResult =
  | { success: true; url: string; activated: true }
  | { success: false; error: string };

type WalletChargeResult =
  | {
      ok: true;
      paymentRef: string;
      walletId: string;
      previousAvailable: number;
      fullDemo: boolean;
    }
  | { ok: false; error: string };

type CardChargeResult =
  | { ok: true; paymentIntentId: string }
  | { ok: false; error: string };

async function successUrl(type: string): Promise<string> {
  return `${await getAppBaseUrl()}/promote?promotion=success&type=${encodeURIComponent(type)}`;
}

async function resolveUserEmail(userId: string): Promise<string | null> {
  const admin = tryCreateAdminClient();
  if (admin) {
    const { data } = await admin.from("profiles").select("email").eq("id", userId).maybeSingle();
    return data?.email ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}

async function restoreWalletBalance(input: {
  walletId: string;
  userId: string;
  previousAvailable: number;
  fullDemo: boolean;
}): Promise<void> {
  if (input.fullDemo) return;
  const admin = tryCreateAdminClient();
  if (!admin) return;
  await admin
    .from("wallets")
    .update({ available_balance: input.previousAvailable })
    .eq("id", input.walletId)
    .eq("user_id", input.userId);
}

async function chargeWalletForPromotion(input: {
  userId: string;
  amountCents: number;
  orderNumber: string;
  productTitle: string;
  paymentRef: string;
}): Promise<WalletChargeResult> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return { ok: false, error: toPromotionPaymentSafeError("process") };
  }

  const amountGbp = roundWalletMoney(input.amountCents / 100);
  if (amountGbp <= 0) {
    return { ok: false, error: toPromotionPaymentSafeError("payment") };
  }

  let { data: wallet } = await admin
    .from("wallets")
    .select("id, available_balance")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (!wallet) {
    const { data: created } = await admin
      .from("wallets")
      .insert({ user_id: input.userId, available_balance: 0, pending_balance: 0 })
      .select("id, available_balance")
      .single();
    wallet = created;
  }

  if (!wallet) {
    return { ok: false, error: toPromotionPaymentSafeError("process") };
  }

  const available = Number(wallet.available_balance);
  if (!canDebitAvailable(available, amountGbp)) {
    return { ok: false, error: "Insufficient wallet balance." };
  }

  const email = await resolveUserEmail(input.userId);
  const fullDemo = isFullDemoEmail(email);
  const nextBalance = fullDemo
    ? FULL_DEMO_VIRTUAL_FUNDS_GBP
    : roundWalletMoney(available - amountGbp);

  const { data: debited, error: debitError } = await admin
    .from("wallets")
    .update({ available_balance: nextBalance })
    .eq("id", wallet.id)
    .eq("user_id", input.userId)
    .gte("available_balance", amountGbp)
    .select("id");

  if (debitError || !debited?.length) {
    return { ok: false, error: toPromotionPaymentSafeError("payment") };
  }

  const { error: txError } = await admin.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    user_id: input.userId,
    order_number: input.orderNumber,
    product_title: input.productTitle,
    amount: -amountGbp,
    status: "completed",
    type: "promotion",
    description: `profit:rovexo|${input.paymentRef}|non_refundable`,
  });

  if (txError) {
    await restoreWalletBalance({
      walletId: wallet.id,
      userId: input.userId,
      previousAvailable: available,
      fullDemo,
    });
    return { ok: false, error: toPromotionPaymentSafeError("process") };
  }

  return {
    ok: true,
    paymentRef: input.paymentRef,
    walletId: wallet.id,
    previousAvailable: available,
    fullDemo,
  };
}

async function chargeDefaultCardForPromotion(input: {
  userId: string;
  amountCents: number;
  label: string;
  idempotencyKey: string;
}): Promise<CardChargeResult> {
  if (!isStripeConfigured()) {
    return { ok: false, error: toPromotionPaymentSafeError("payment") };
  }

  const methods = await listPaymentMethods(input.userId).catch(() => []);
  const defaultMethod = methods.find((m) => m.isDefault) ?? methods[0] ?? null;
  if (!defaultMethod) {
    return {
      ok: false,
      error: "Add a default saved card in Payment Methods, or pay with My Wallet.",
    };
  }

  const customerId = await ensureStripeCustomer(input.userId);
  if (!customerId) {
    return { ok: false, error: toPromotionPaymentSafeError("process") };
  }

  try {
    const stripe = getStripeClient();
    const intent = await stripe.paymentIntents.create(
      {
        amount: input.amountCents,
        currency: "gbp",
        customer: customerId,
        payment_method: defaultMethod.stripePaymentMethodId,
        confirm: true,
        off_session: true,
        description: input.label,
        metadata: {
          checkoutType: "promotion_in_app",
          userId: input.userId,
          profitDestination: "rovexo",
        },
      },
      { idempotencyKey: input.idempotencyKey },
    );

    if (intent.status !== "succeeded") {
      return { ok: false, error: toPromotionPaymentSafeError("payment") };
    }

    return { ok: true, paymentIntentId: intent.id };
  } catch {
    return { ok: false, error: toPromotionPaymentSafeError("payment") };
  }
}

type CollectPaymentOk = {
  ok: true;
  stripePaymentIntentId: string | null;
  paymentRef: string;
  walletRollback?: {
    walletId: string;
    previousAvailable: number;
    fullDemo: boolean;
  };
};

async function collectPayment(input: {
  userId: string;
  paymentMethod: PromotionPaymentMethodId;
  amountCents: number;
  orderNumber: string;
  productTitle: string;
  label: string;
  idempotencyKey: string;
}): Promise<CollectPaymentOk | { ok: false; error: string }> {
  if (input.paymentMethod === "wallet") {
    const paymentRef = `wallet:${input.orderNumber}`;
    const charged = await chargeWalletForPromotion({
      userId: input.userId,
      amountCents: input.amountCents,
      orderNumber: input.orderNumber,
      productTitle: input.productTitle,
      paymentRef,
    });
    if (!charged.ok) return charged;
    return {
      ok: true,
      stripePaymentIntentId: null,
      paymentRef: charged.paymentRef,
      walletRollback: {
        walletId: charged.walletId,
        previousAvailable: charged.previousAvailable,
        fullDemo: charged.fullDemo,
      },
    };
  }

  const charged = await chargeDefaultCardForPromotion({
    userId: input.userId,
    amountCents: input.amountCents,
    label: input.label,
    idempotencyKey: input.idempotencyKey,
  });
  if (!charged.ok) return charged;
  return {
    ok: true,
    stripePaymentIntentId: charged.paymentIntentId,
    paymentRef: `card:${charged.paymentIntentId}`,
  };
}

async function assertSellerPromotionPurchasable(input: {
  sellerId: string;
  type: SellerPromotionType;
  packageId: string;
}): Promise<
  | { ok: true; packageId: string; priceCents: number; durationLabel: string; days: number }
  | { ok: false; error: string }
> {
  if (input.type === "store_featured") {
    if (!isValidStoreShowcasePackage(input.packageId)) {
      return { ok: false, error: "Store Showcase is available for 7 days only." };
    }

    const supabase = await createClient();
    const [products, status, holidayModeEnabled] = await Promise.all([
      (async () => {
        const admin = tryCreateAdminClient();
        const client = admin ?? supabase;
        const { data } = await client
          .from("products")
          .select("id")
          .eq("seller_id", input.sellerId)
          .eq("status", "published")
          .gt("stock", 0);
        return data ?? [];
      })(),
      getStoreShowcasePersistenceStatus(input.sellerId),
      isSellerOnVacation(supabase, input.sellerId),
    ]);

    const gate = resolveStoreShowcasePurchaseGate({
      activeListingCount: products.length,
      holidayModeEnabled,
      hasActiveStoreShowcase: status.hasActiveStoreShowcase,
      lastExpiredAt: status.lastExpiredAt,
    });

    if (!gate.canPurchase) {
      if (!gate.visibility.visible) {
        return { ok: false, error: "Store Showcase requires at least 2 active listings." };
      }
      if (!gate.visibility.enabled) {
        return { ok: false, error: "Store Showcase is disabled while Holiday Mode is on." };
      }
      return { ok: false, error: gate.antiAbuse.message };
    }

    const quote = resolveSellerPromotionPricing({
      type: "store_featured",
      packageId: STORE_SHOWCASE_PACKAGE_ID,
    });
    if (!quote) return { ok: false, error: "Invalid promotion package." };
    return {
      ok: true,
      packageId: STORE_SHOWCASE_PACKAGE_ID,
      priceCents: quote.priceCents,
      durationLabel: quote.durationLabel,
      days: quote.days,
    };
  }

  const tier = resolveBoostPackageTier(input.packageId);
  if (!tier) return { ok: false, error: "Invalid promotion package." };

  const admin = tryCreateAdminClient();
  const supabase = await createClient();
  const client = admin ?? supabase;
  const { data: products } = await client
    .from("products")
    .select("id")
    .eq("seller_id", input.sellerId)
    .eq("status", "published")
    .gt("stock", 0);

  if (!products?.length) {
    return { ok: false, error: "You need at least one active listing to promote." };
  }

  return {
    ok: true,
    packageId: input.packageId,
    priceCents: tier.priceCents,
    durationLabel: tier.label,
    days: tier.days,
  };
}

export async function paySellerPromotion(input: {
  sellerId: string;
  type: SellerPromotionType;
  packageId: string;
  paymentMethod: PromotionPaymentMethodId;
}): Promise<PayPromotionResult> {
  let walletRollback:
    | { walletId: string; previousAvailable: number; fullDemo: boolean }
    | undefined;

  try {
    const gate = await assertSellerPromotionPurchasable(input);
    if (!gate.ok) {
      return { success: false, error: sanitizePromotionCheckoutError(gate.error) };
    }

    const pendingId = await createPendingSellerPromotion(
      input.sellerId,
      input.type,
      gate.packageId,
      gate.priceCents,
    );

    if (!pendingId) {
      return { success: false, error: toPromotionPaymentSafeError("process") };
    }

    const orderNumber = `PROMO-S-${pendingId.slice(0, 8).toUpperCase()}`;
    const label = input.type === "store_featured" ? "Store Showcase" : "Boost Package";

    const paid = await collectPayment({
      userId: input.sellerId,
      paymentMethod: input.paymentMethod,
      amountCents: gate.priceCents,
      orderNumber,
      productTitle: `${label} · ${gate.durationLabel}`,
      label: `ROVEXO ${label}`,
      idempotencyKey: `promo-seller-${pendingId}`,
    });

    if (!paid.ok) {
      return { success: false, error: sanitizePromotionCheckoutError(paid.error) };
    }

    walletRollback = paid.walletRollback;

    const applied = await applySellerPromotion({
      sellerId: input.sellerId,
      type: input.type,
      packageId: gate.packageId,
      amountCents: gate.priceCents,
      sellerPromotionId: pendingId,
      stripePaymentIntentId: paid.stripePaymentIntentId,
      actorId: input.sellerId,
      reason: `paid:${input.paymentMethod}|profit:rovexo|${paid.paymentRef}`,
    });

    if (!applied.success) {
      if (walletRollback) {
        await restoreWalletBalance({
          ...walletRollback,
          userId: input.sellerId,
        });
      }
      return {
        success: false,
        error: sanitizePromotionCheckoutError(
          applied.error ?? toPromotionPaymentSafeError("process"),
        ),
      };
    }

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + gate.days);

    await notifyPromotionActivated({
      userId: input.sellerId,
      kind: input.type,
      durationLabel: gate.durationLabel,
      endsAt: endsAt.toISOString(),
    }).catch(() => undefined);

    return { success: true, activated: true, url: await successUrl(input.type) };
  } catch {
    if (walletRollback) {
      await restoreWalletBalance({
        ...walletRollback,
        userId: input.sellerId,
      });
    }
    return { success: false, error: toPromotionPaymentSafeError("process") };
  }
}

export async function payListingPromotion(input: {
  sellerId: string;
  productId: string;
  type: PromotionType;
  durationId: string;
  paymentMethod: PromotionPaymentMethodId;
  scheduledStartAt?: string | null;
}): Promise<PayPromotionResult> {
  let walletRollback:
    | { walletId: string; previousAvailable: number; fullDemo: boolean }
    | undefined;

  try {
    const pricing = await getMarketplacePricingSettings();
    const duration = getPromotionDuration(input.type, input.durationId, pricing);
    if (!duration) {
      return { success: false, error: sanitizePromotionCheckoutError("Invalid promotion duration.") };
    }

    const supabase = await createClient();
    const { data: product } = await supabase
      .from("products")
      .select("id, title, status")
      .eq("id", input.productId)
      .eq("seller_id", input.sellerId)
      .maybeSingle();

    if (!product) {
      return { success: false, error: sanitizePromotionCheckoutError("Listing not found.") };
    }
    if (product.status !== "published") {
      return {
        success: false,
        error: sanitizePromotionCheckoutError("Only published listings can be promoted."),
      };
    }

    if (input.type === "bump") {
      const bumpCheck = await validateBumpPurchase(input.sellerId, input.productId);
      if (!bumpCheck.ok) {
        return { success: false, error: sanitizePromotionCheckoutError(bumpCheck.error) };
      }
    }

    const pending = await createPendingPromotion(
      input.sellerId,
      input.productId,
      input.type,
      input.durationId,
      duration.priceCents,
    );

    if (!pending) {
      return { success: false, error: toPromotionPaymentSafeError("process") };
    }

    const label = input.type === "bump" ? "Bump Listing" : "Featured Listing";
    const orderNumber = `PROMO-${pending.id.slice(0, 8).toUpperCase()}`;

    const paid = await collectPayment({
      userId: input.sellerId,
      paymentMethod: input.paymentMethod,
      amountCents: duration.priceCents,
      orderNumber,
      productTitle: `${label}: ${product.title}`,
      label: `ROVEXO ${label}`,
      idempotencyKey: `promo-listing-${pending.id}`,
    });

    if (!paid.ok) {
      return { success: false, error: sanitizePromotionCheckoutError(paid.error) };
    }

    walletRollback = paid.walletRollback;

    const applied = await applyListingPromotion({
      sellerId: input.sellerId,
      productId: input.productId,
      type: input.type,
      durationId: input.durationId,
      amountCents: duration.priceCents,
      promotionId: pending.id,
      stripePaymentIntentId: paid.stripePaymentIntentId,
      scheduledStartAt: input.scheduledStartAt,
    });

    if (!applied.success) {
      if (walletRollback) {
        await restoreWalletBalance({
          ...walletRollback,
          userId: input.sellerId,
        });
      }
      return {
        success: false,
        error: sanitizePromotionCheckoutError(
          applied.error ?? toPromotionPaymentSafeError("process"),
        ),
      };
    }

    await notifyPromotionActivated({
      userId: input.sellerId,
      kind: input.type === "feature" ? "feature" : "bump",
      durationLabel: duration.label,
      endsAt: applied.endsAt ?? null,
    }).catch(() => undefined);

    return { success: true, activated: true, url: await successUrl(input.type) };
  } catch {
    if (walletRollback) {
      await restoreWalletBalance({
        ...walletRollback,
        userId: input.sellerId,
      });
    }
    return { success: false, error: toPromotionPaymentSafeError("process") };
  }
}
