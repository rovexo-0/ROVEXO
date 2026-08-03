import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CheckoutPage } from "@/features/checkout/components/CheckoutPage";
import { CheckoutGuardBlocked } from "@/features/checkout/components/CheckoutGuardBlocked";
import { loadCheckoutPageProps } from "@/features/checkout/lib/load-checkout-page";
import type { CheckoutStep } from "@/features/checkout/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  initialStep?: CheckoutStep;
};

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function CheckoutSlugPage({
  params,
  searchParams,
  initialStep = "review",
}: Props) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};

  const result = await loadCheckoutPageProps(slug, {
    offerId: first(query.offerId),
    idempotencyKey: first(query.bn),
    orderId: first(query.orderId),
    transactionId: first(query.txn),
    checkoutSessionId: first(query.cs),
    enforceBuyNowGuard: true,
  });

  if (result.kind === "blocked") {
    return (
      <BetaAppShell showBottomNav={false} className="checkout-v1-shell">
        <CheckoutGuardBlocked code={result.code} listingHref={result.listingHref} />
      </BetaAppShell>
    );
  }

  return (
    <CheckoutPage
      product={result.product}
      initialDraft={result.initialDraft}
      liveShippingEnabled={result.liveShippingEnabled}
      buyerPhone={result.buyerPhone}
      acceptedOfferId={result.acceptedOfferId}
      initialStep={initialStep}
      pendingOrderId={result.orderId}
      checkoutSessionId={result.checkoutSessionId}
      bundleSnapshot={result.bundleSnapshot}
    />
  );
}
