import { redirect, notFound } from "next/navigation";
import { createCheckoutDraft } from "@/features/checkout/types";
import { getDefaultCheckoutAddress } from "@/lib/checkout/address";
import { getDefaultPaymentMethod } from "@/lib/checkout/payment";
import { fetchProductBySlug } from "@/lib/products/queries";
import { getProfile } from "@/lib/profile/data";
import { getProfileDetails } from "@/lib/profile/service";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { resolveProfileCompletionRedirect } from "@/lib/account/profile-completion";
import type { CheckoutStep } from "@/features/checkout/types";

export async function loadCheckoutPageProps(slug: string) {
  const product = await fetchProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const profile = await getProfile();
  const completionRedirect = await resolveProfileCompletionRedirect(
    profile.id,
    "checkout",
    `/checkout/${slug}`,
  );
  if (completionRedirect) {
    redirect(completionRedirect);
  }

  const details = await getProfileDetails(profile.id);
  const address = await getDefaultCheckoutAddress(profile);
  const initialDraft = createCheckoutDraft(address, getDefaultPaymentMethod());

  return {
    product,
    initialDraft,
    liveShippingEnabled: isSendcloudConfigured(),
    buyerPhone: details?.phone ?? null,
  };
}

export type CheckoutRouteStep = CheckoutStep;
