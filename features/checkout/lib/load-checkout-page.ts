import { redirect, notFound } from "next/navigation";
import { createCheckoutDraft } from "@/features/checkout/types";
import { getDefaultCheckoutAddress } from "@/lib/checkout/address";
import { getDefaultPaymentMethod } from "@/lib/checkout/payment";
import { fetchProductBySlug } from "@/lib/products/queries";
import { getProfile } from "@/lib/profile/data";
import { getProfileDetails } from "@/lib/profile/service";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { resolveProfileCompletionRedirect } from "@/lib/account/profile-completion";
import {
  resolveLockedAcceptedOffer,
  resolveTransactionItemPrice,
} from "@/lib/offers/accepted-price";
import type { CheckoutStep } from "@/features/checkout/types";

export async function loadCheckoutPageProps(
  slug: string,
  options?: { offerId?: string | null },
) {
  const product = await fetchProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const profile = await getProfile();
  const checkoutReturnTo = options?.offerId
    ? `/checkout/${slug}?offerId=${encodeURIComponent(options.offerId)}`
    : `/checkout/${slug}`;
  const completionRedirect = await resolveProfileCompletionRedirect(
    profile.id,
    "checkout",
    checkoutReturnTo,
  );
  if (completionRedirect) {
    redirect(completionRedirect);
  }

  const details = await getProfileDetails(profile.id);
  const address = await getDefaultCheckoutAddress(profile);
  const initialDraft = createCheckoutDraft(address, getDefaultPaymentMethod());

  const lockedOffer = await resolveLockedAcceptedOffer({
    buyerId: profile.id,
    productId: product.id,
    offerId: options?.offerId,
  });

  const transactionItemPrice = resolveTransactionItemPrice({
    listingPrice: product.price,
    acceptedOfferPrice: lockedOffer?.acceptedOfferPrice,
  });

  // Checkout must never surface listing.price once an accepted offer is locked.
  const checkoutProduct =
    lockedOffer != null
      ? { ...product, price: transactionItemPrice }
      : product;

  return {
    product: checkoutProduct,
    initialDraft,
    liveShippingEnabled: isSendcloudConfigured(),
    buyerPhone: details?.phone ?? null,
    acceptedOfferId: lockedOffer?.offerId ?? null,
    /** Listing price kept only for audit — not used for totals when offer locked. */
    listingPrice: product.price,
  };
}

export type CheckoutRouteStep = CheckoutStep;
