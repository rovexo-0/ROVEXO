import { redirect } from "next/navigation";
import { createCheckoutDraft } from "@/features/checkout/types";
import { getDefaultCheckoutAddress } from "@/lib/checkout/address";
import { getDefaultPaymentMethod } from "@/lib/checkout/payment";
import { fetchProductBySlug, fetchProductBySlugForCheckout } from "@/lib/products/queries";
import { getProfile } from "@/lib/profile/data";
import { getProfileDetails } from "@/lib/profile/service";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { resolveProfileCompletionRedirect } from "@/lib/account/profile-completion.server";
import {
  resolveLockedAcceptedOffer,
  resolveTransactionItemPrice,
} from "@/lib/offers/accepted-price";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RvxClassifiedCode } from "@/lib/checkout/buy-now-guard-v1";
import type { CheckoutDraft } from "@/features/checkout/types";
import type { ProductDetail } from "@/lib/products/types";
import {
  CHECKOUT_SESSION_ENGINE_destroy,
  CHECKOUT_SESSION_ENGINE_expireAll,
  CHECKOUT_SESSION_ENGINE_getByPublicId,
  CHECKOUT_SESSION_ENGINE_isExpired,
} from "@/lib/checkout/engines/checkout-session-engine-v1";

export type CheckoutPagePropsOk = {
  kind: "ok";
  product: ProductDetail;
  initialDraft: CheckoutDraft;
  liveShippingEnabled: boolean;
  buyerPhone: string | null;
  acceptedOfferId: string | null;
  listingPrice: number;
  /** Master Architecture — null until payment success. */
  orderId: string | null;
  transactionId: string | null;
  checkoutSessionId: string | null;
};

export type CheckoutPagePropsBlocked = {
  kind: "blocked";
  code: RvxClassifiedCode;
  listingHref: string;
};

export type CheckoutPageLoadResult = CheckoutPagePropsOk | CheckoutPagePropsBlocked;

/**
 * Checkout page loader — Master Checkout Architecture v1.0.
 * Requires open Checkout Session (`cs`). No awaiting_payment order required.
 */
export async function loadCheckoutPageProps(
  slug: string,
  options?: {
    offerId?: string | null;
    idempotencyKey?: string | null;
    orderId?: string | null;
    transactionId?: string | null;
    checkoutSessionId?: string | null;
    enforceBuyNowGuard?: boolean;
  },
): Promise<CheckoutPageLoadResult> {
  const enforceBuyNowGuard = options?.enforceBuyNowGuard !== false;
  const profile = await getProfile();

  let resolvedCsId: string | null = null;

  if (enforceBuyNowGuard) {
    await CHECKOUT_SESSION_ENGINE_expireAll();

    const cs = options?.checkoutSessionId?.trim() ?? "";
    if (!cs) {
      if (process.env.NODE_ENV !== "development") {
        return {
          kind: "blocked",
          code: "RVX-2001",
          listingHref: `/listing/${slug}`,
        };
      }
      // Dev visual-only: allow load without cs (no money path).
    } else {
      const session = await CHECKOUT_SESSION_ENGINE_getByPublicId(cs);
      if (!session || session.product_slug !== slug) {
        return {
          kind: "blocked",
          code: "RVX-2001",
          listingHref: `/listing/${slug}`,
        };
      }
      if (!profile?.id || session.buyer_id !== profile.id) {
        return {
          kind: "blocked",
          code: "RVX-2002",
          listingHref: `/listing/${slug}`,
        };
      }
      if (session.status !== "open" || CHECKOUT_SESSION_ENGINE_isExpired(session.expires_at)) {
        if (session.status === "open") {
          await CHECKOUT_SESSION_ENGINE_destroy({ session, status: "expired" });
        }
        return {
          kind: "blocked",
          code: "RVX-2012",
          listingHref: `/listing/${slug}`,
        };
      }
      resolvedCsId = session.public_id;
    }
  }

  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(`/checkout/${slug}`)}`);
  }

  const completion = await resolveProfileCompletionRedirect(
    profile.id,
    "checkout",
    `/checkout/${slug}`,
  );
  if (completion) {
    redirect(completion);
  }

  const product =
    resolvedCsId != null
      ? await fetchProductBySlugForCheckout(slug)
      : await fetchProductBySlug(slug);
  if (!product) {
    return {
      kind: "blocked",
      code: "RVX-2001",
      listingHref: `/listing/${slug}`,
    };
  }

  // Reserved listings are OK when owned by this checkout session.
  if (resolvedCsId) {
    const session = await CHECKOUT_SESSION_ENGINE_getByPublicId(resolvedCsId);
    if (session && product.id !== session.listing_id) {
      return {
        kind: "blocked",
        code: "RVX-2001",
        listingHref: `/listing/${slug}`,
      };
    }
  } else if (product.availability === "out_of_stock" || product.stock <= 0) {
    return {
      kind: "blocked",
      code: "RVX-2001",
      listingHref: `/listing/${slug}`,
    };
  }

  const [defaultAddress, details] = await Promise.all([
    getDefaultCheckoutAddress(profile),
    getProfileDetails(profile.id),
  ]);
  const defaultPaymentMethod = getDefaultPaymentMethod();

  const lockedOffer = await resolveLockedAcceptedOffer({
    buyerId: profile.id,
    productId: product.id,
    offerId: options?.offerId,
  });

  const listingPrice = resolveTransactionItemPrice({
    listingPrice: product.price,
    acceptedOfferPrice: lockedOffer?.acceptedOfferPrice,
  });

  const checkoutProduct =
    lockedOffer != null ? { ...product, price: listingPrice } : product;

  const admin = createAdminClient();
  const { data: phoneRow } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", profile.id)
    .maybeSingle();

  const initialDraft = createCheckoutDraft(defaultAddress, defaultPaymentMethod);

  return {
    kind: "ok",
    product: checkoutProduct,
    initialDraft,
    liveShippingEnabled: isSendcloudConfigured(),
    buyerPhone: phoneRow?.phone ?? details?.phone ?? null,
    acceptedOfferId: lockedOffer?.offerId ?? options?.offerId ?? null,
    listingPrice: product.price,
    orderId: null,
    transactionId: null,
    checkoutSessionId: resolvedCsId,
  };
}
