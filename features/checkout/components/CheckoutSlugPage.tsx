import { CheckoutPage } from "@/features/checkout/components/CheckoutPage";
import { loadCheckoutPageProps } from "@/features/checkout/lib/load-checkout-page";
import type { CheckoutStep } from "@/features/checkout/types";

type Props = {
  params: Promise<{ slug: string }>;
  initialStep?: CheckoutStep;
};

export async function CheckoutSlugPage({ params, initialStep = "review" }: Props) {
  const { slug } = await params;
  const props = await loadCheckoutPageProps(slug);
  return <CheckoutPage {...props} initialStep={initialStep} />;
}
