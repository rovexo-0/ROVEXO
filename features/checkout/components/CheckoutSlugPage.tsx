import { CheckoutPage } from "@/features/checkout/components/CheckoutPage";
import { loadCheckoutPageProps } from "@/features/checkout/lib/load-checkout-page";
import type { CheckoutStep } from "@/features/checkout/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  initialStep?: CheckoutStep;
};

export async function CheckoutSlugPage({
  params,
  searchParams,
  initialStep = "review",
}: Props) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const rawOfferId = query.offerId;
  const offerId = Array.isArray(rawOfferId) ? rawOfferId[0] : rawOfferId;
  const props = await loadCheckoutPageProps(slug, { offerId: offerId ?? null });
  return <CheckoutPage {...props} initialStep={initialStep} />;
}
