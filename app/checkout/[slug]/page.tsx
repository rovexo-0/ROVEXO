import { redirect } from "next/navigation";
import { CheckoutPage } from "@/features/checkout/components/CheckoutPage";
import { createCheckoutDraft } from "@/features/checkout/types";
import { getDefaultCheckoutAddress } from "@/lib/checkout/address";
import { getDefaultPaymentMethod } from "@/lib/checkout/payment";
import { fetchProductBySlug } from "@/lib/products/queries";
import { getProfile } from "@/lib/profile/data";
import { getProfileDetails } from "@/lib/profile/service";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { resolveProfileCompletionRedirect } from "@/lib/account/profile-completion";
import { notFound } from "next/navigation";

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CheckoutRoute({ params }: CheckoutPageProps) {
  const { slug } = await params;
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

  return (
    <CheckoutPage
      product={product}
      initialDraft={initialDraft}
      liveShippingEnabled={isSendcloudConfigured()}
      buyerPhone={details?.phone ?? null}
    />
  );
}
